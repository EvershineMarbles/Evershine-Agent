const { putObject } = require("../common/s3CommonMethods")
const Post = require("../database/models/postModel")
const Agent = require("../database/models/agentModel")
const ConsultantLevel = require("../database/models/consultantLevelModel")
const Client = require("../database/models/clientModel")

const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require("http-status-codes")
const {
  addToCartService,
  removeFromCartService,
  getCartService,
  getAllOrderFromSpecificClient,
  createOrderFromCart,
  updateOrderStatus,
  updatePaymentStatus,
  clearCartService,
} = require("../service/prodcutService/addToCartService")
const {
  addToWishlistService,
  removeItemFromWishlistService,
  getWishlistService,
} = require("../service/prodcutService/wishlistService")
const {
  createClientService,
  updateClientDetailsService,
  getAllClientService,
  getClientDetailsByIdService,
  getClientOrdersService,
  getClientAnalyticsService,
} = require("../service/userService/userService")
const { clientValidationSchema, clientBasicDetails, agentRegisterSchema } = require("../utils/validations")
const { ZodError } = require("zod")
const {
  createAgentService,
  loginAgentService,
  getAllAssociatedClientService,
  getAgentClientOrdersService,
  generateClientImpersonationToken,
  getAgentAnalytics,
} = require("../service/agent/agentService")
const {
  createOrderService,
  getOrderByIdService,
  updateOrderStatusService,
  updatePaymentStatusService,
  generateInvoiceService,
} = require("../service/orderService/orderService")
const { generateAccessToken, generateRefreshToken, verifyToken } = require("../utils/auth")
const Order = require("../database/models/orderModel")
const Cart = require("../database/models/cartModel")
const clientModel = require("../database/models/clientModel")
const agentModel = require("../database/models/agentModel")
const { applyCommissionToProduct, applyCommissionToProducts, calculateFinalPrice } = require("../utils/priceCalculator")

/**
 * Create post with new fields
 */
const createPost = async (req, res) => {
  try {
    const {
      name,
      price,
      category,
      applicationAreas,
      description,
      quantityAvailable,
      size,
      sizeUnit,
      numberOfPieces,
      thickness,
      finishes,
      status = "draft",
    } = req.body

    // Validate required fields
    if (!name || !price || !category || !applicationAreas) {
      return res.status(400).json({
        success: false,
        msg: "Name, price, category, and applicationAreas are required",
      })
    }

    // Handle image uploads
    let imageUrls = []
    if (req.files && req.files.length > 0) {
      const s3UploadLinks = await Promise.all(
        req.files.map(async (image) => {
          const uploadParams = {
            Bucket: "evershine-product",
            Key: `${Date.now()}-${image.originalname}`,
            Body: image.buffer,
            ContentType: image.mimetype,
          }

          try {
            return await putObject(uploadParams)
          } catch (error) {
            console.error("S3 upload error:", error)
            throw new Error(`Failed to upload image: ${error.message}`)
          }
        }),
      )
      imageUrls = s3UploadLinks
    }

    // Create product with new fields
    const product = new Post({
      name,
      price: Number.parseFloat(price),
      category,
      applicationAreas,
      description: description || "",
      quantityAvailable: Number.parseInt(quantityAvailable) || 0,
      size: size || "",
      sizeUnit: sizeUnit || "in",
      numberOfPieces: numberOfPieces ? Number.parseInt(numberOfPieces) : undefined,
      thickness: thickness || "",
      finishes: finishes || "",
      image: imageUrls,
      status,
    })

    const savedProduct = await product.save()

    res.status(201).json({
      success: true,
      msg: "Product created successfully",
      data: {
        postId: savedProduct.postId,
      },
    })
  } catch (error) {
    console.error("Error in createPost:", error)
    res.status(400).json({
      success: false,
      msg: error.message || "Failed to create product",
    })
  }
}

/**
 * Update product with new fields
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params
    const updates = { ...req.body }

    // Find product
    const product = await Post.findOne({ postId: id })

    if (!product) {
      return res.status(404).json({
        success: false,
        msg: "Product not found",
      })
    }

    // Handle numeric fields
    if (updates.price) {
      updates.price = Number.parseFloat(updates.price)
    }

    if (updates.quantityAvailable) {
      updates.quantityAvailable = Number.parseInt(updates.quantityAvailable)
    }

    if (updates.numberOfPieces) {
      updates.numberOfPieces = Number.parseInt(updates.numberOfPieces)
    }

    // Handle existing images if provided
    if (updates.existingImages) {
      try {
        // Parse the JSON string of existing images
        const existingImages = JSON.parse(updates.existingImages)
        if (Array.isArray(existingImages)) {
          updates.image = existingImages
        }
        delete updates.existingImages
      } catch (error) {
        console.error("Error parsing existingImages:", error)
      }
    }

    // Handle image uploads if any
    if (req.files && req.files.length > 0) {
      const s3UploadLinks = await Promise.all(
        req.files.map(async (image) => {
          const uploadParams = {
            Bucket: "evershine-product",
            Key: `${Date.now()}-${image.originalname}`,
            Body: image.buffer,
            ContentType: image.mimetype,
          }
          return await putObject(uploadParams)
        }),
      )
      if (updates.image && Array.isArray(updates.image)) {
        updates.image = [...updates.image, ...s3UploadLinks]
      } else {
        updates.image = s3UploadLinks
      }
    }

    // Update product
    const updatedProduct = await Post.findOneAndUpdate({ postId: id }, updates, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      success: true,
      msg: "Product updated successfully",
      data: {
        postId: updatedProduct.postId,
      },
    })
  } catch (error) {
    console.error("Error in updateProduct:", error)
    res.status(400).json({
      success: false,
      msg: error.message || "Failed to update product",
    })
  }
}

// Get post by ID with calculated prices
const getPostDataById = async (req, res) => {
  try {
    const { id } = req.query

    if (!id) {
      return res.status(400).json({
        success: false,
        msg: "Post ID is required",
      })
    }

    const post = await Post.find({ postId: id })
    console.log("Found post:", post)

    if (!post || post.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "Post not found",
      })
    }

    // Get client and agent information for price calculation
    let clientId = null
    let agentId = null

    if (req.agent) {
      // Direct agent access
      agentId = req.agent.agentId
    } else if (req.client) {
      clientId = req.client.clientId
      if (req.isImpersonating && req.impersonatingAgent) {
        // Agent impersonating a client
        agentId = req.impersonatingAgent.agentId
      }
    }

    // Apply commission calculations to get final price
    const postWithCalculatedPrice = await applyCommissionToProduct(post[0], clientId, agentId)

    res.status(200).json({
      success: true,
      data: [postWithCalculatedPrice], // Keep the same format as original response
    })
  } catch (error) {
    console.error("Error fetching post:", error)
    res.status(500).json({
      success: false,
      msg: error.message || "Internal server error",
    })
  }
}

// 🚀 FIXED: getAllProducts with proper commission calculation
const getAllProducts = async (req, res) => {
  try {
    console.log("🚀 getAllProducts API called at:", new Date().toISOString())

    // 📊 PAGINATION: Extract pagination parameters
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    // 🔍 SEARCH: Extract search parameters
    const searchQuery = req.query.search || ""
    const category = req.query.category || ""
    const sortBy = req.query.sortBy || "createdAt"
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1

    // 🎯 CLIENT DATA: Extract client information
    const clientId = req.query.clientId || req.headers["client-id"]
    const agentId = req.query.agentId || req.headers["agent-id"]

    console.log("📋 Request params:", { page, limit, searchQuery, category, clientId, agentId })

    // 🏗️ BUILD QUERY: Construct database query
    const query = {}

    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
        { category: { $regex: searchQuery, $options: "i" } },
      ]
    }

    if (category && category !== "all") {
      query.category = category
    }

    // 📊 COUNT: Get total count for pagination (optimized)
    const totalProducts = await Post.countDocuments(query)

    if (totalProducts === 0) {
      return res.status(200).json({
        success: true,
        message: "No products found",
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalProducts: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      })
    }

    // 🔥 PERFORMANCE OPTIMIZATION: Use lean() and select only needed fields
    const products = await Post.find(query)
      .select("title description price category images createdAt updatedAt stock availability")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean() // 🚀 CRITICAL: Returns plain JS objects (faster)
      .exec()

    console.log(`📦 Found ${products.length} products out of ${totalProducts} total`)

    // 💰 COMMISSION CALCULATION: Get agent commission rate
    let agentCommissionRate = 0
    let isGlobalRate = true
    let agentData = null

    if (agentId) {
      const cacheKey = `agent_${agentId}`
      agentData = cache.get(cacheKey)

      if (!agentData || Date.now() - agentData.timestamp > CACHE_TTL) {
        agentData = await Agent.findById(agentId).select("commissionRate name email").lean()
        if (agentData) {
          cache.set(cacheKey, { ...agentData, timestamp: Date.now() })
        }
      }

      agentCommissionRate = agentData?.commissionRate || 0
      isGlobalRate = false
    }

    // 👤 CLIENT DATA: Get client information
    let clientData = null
    if (clientId) {
      const cacheKey = `client_${clientId}`
      clientData = cache.get(cacheKey)

      if (!clientData || Date.now() - clientData.timestamp > CACHE_TTL) {
        clientData = await Client.findById(clientId).select("consultantLevel name email").lean()
        if (clientData) {
          cache.set(cacheKey, { ...clientData, timestamp: Date.now() })
        }
      }
    }

    console.log("💼 Commission info:", {
      agentCommissionRate,
      clientConsultantLevel: clientData?.consultantLevel,
      isGlobalRate,
    })

    // 🔥 PERFORMANCE OPTIMIZATION: Apply pricing to all products with DYNAMIC consultant level
    const productsWithCalculatedPrices = await Promise.all(
      products.map(async (product) => {
        // 🚀 DYNAMIC: Get fresh consultant level for each calculation
        let consultantLevelCommission = 0
        let clientConsultantLevel = null

        if (clientData?.consultantLevel) {
          const cacheKey = `consultant_${clientData.consultantLevel}`
          clientConsultantLevel = cache.get(cacheKey)

          if (!clientConsultantLevel || Date.now() - clientConsultantLevel.timestamp > CACHE_TTL) {
            clientConsultantLevel = await ConsultantLevel.findById(clientData.consultantLevel)
              .select("commissionRate name level")
              .lean()
            if (clientConsultantLevel) {
              cache.set(cacheKey, { ...clientConsultantLevel, timestamp: Date.now() })
            }
          }

          consultantLevelCommission = clientConsultantLevel?.commissionRate || 0
        }

        // Calculate total commission rate dynamically
        const totalCommissionRate = agentCommissionRate + consultantLevelCommission

        // 💰 PRICE CALCULATION: base price + agent commission + consultant level commission
        const agentCommissionAmount = (product.price * agentCommissionRate) / 100
        const consultantCommissionAmount = (product.price * consultantLevelCommission) / 100
        const finalPrice = product.price + agentCommissionAmount + consultantCommissionAmount

        return {
          ...product,
          _id: product._id.toString(), // Convert ObjectId to string
          calculatedPrice: Math.round(finalPrice * 100) / 100,
          commissionInfo: {
            agentCommission: agentCommissionRate,
            consultantLevelCommission: consultantLevelCommission,
            totalCommission: totalCommissionRate,
            isGlobalRate: isGlobalRate,
            agentCommissionAmount: Math.round(agentCommissionAmount * 100) / 100,
            consultantCommissionAmount: Math.round(consultantCommissionAmount * 100) / 100,
            consultantLevelId: clientData?.consultantLevel || null,
            consultantLevelName: clientConsultantLevel?.name || "Default",
            consultantLevelNumber: clientConsultantLevel?.level || 0,
          },
          originalPrice: product.price, // Base price for strikethrough
          basePrice: product.price, // Base price for reference
          price: Math.round(finalPrice * 100) / 100, // Final price with all commissions

          // 🎯 ADDITIONAL PRODUCT INFO
          isInStock: product.stock > 0,
          stockStatus: product.stock > 10 ? "In Stock" : product.stock > 0 ? "Low Stock" : "Out of Stock",
          formattedPrice: `₹${Math.round(finalPrice * 100) / 100}`,
          formattedOriginalPrice: `₹${product.price}`,
          discountPercentage: agentCommissionRate + consultantLevelCommission,
        }
      }),
    )

    // 📊 PAGINATION: Calculate pagination metadata
    const totalPages = Math.ceil(totalProducts / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    // 📈 RESPONSE: Send optimized response
    const response = {
      success: true,
      message: `Successfully retrieved ${products.length} products`,
      data: productsWithCalculatedPrices,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalProducts: totalProducts,
        productsPerPage: limit,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
      metadata: {
        searchQuery: searchQuery,
        category: category,
        sortBy: sortBy,
        sortOrder: sortOrder === 1 ? "asc" : "desc",
        agentId: agentId,
        clientId: clientId,
        responseTime: new Date().toISOString(),
        cacheHits: cache.size,
      },
    }

    // 🗜️ COMPRESSION: Set compression headers
    res.set({
      "Cache-Control": "public, max-age=300", // 5 minutes cache
      "Content-Type": "application/json",
      "X-Total-Count": totalProducts.toString(),
      "X-Page": page.toString(),
      "X-Per-Page": limit.toString(),
    })

    console.log("✅ getAllProducts completed successfully")
    return res.status(200).json(response)
  } catch (error) {
    console.error("❌ Error in getAllProducts:", error)

    // 🚨 ERROR HANDLING: Detailed error response
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching products",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
      timestamp: new Date().toISOString(),
      endpoint: "/api/getAllProducts",
    })
  }
}

// 🚀 PERFORMANCE: Cache for frequently accessed data
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Update the deleteProduct function
const deleteProduct = async (req, res) => {
  try {
    const { postId } = req.params
    console.log("Attempting to delete product with ID:", postId)

    if (!postId) {
      return res.status(400).json({
        success: false,
        msg: "Product ID is required",
      })
    }

    const post = await Post.findOneAndDelete({ postId: postId })

    if (!post) {
      return res.status(404).json({
        success: false,
        msg: "Product not found",
      })
    }

    res.status(200).json({
      success: true,
      msg: "Product deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: error.message || "Internal server error",
    })
  }
}

// Update product status
const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!["pending", "approved", "draft"].includes(status)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid status value",
      })
    }

    const post = await Post.findOneAndUpdate({ postId: id }, { status }, { new: true })

    if (!post) {
      return res.status(404).json({
        success: false,
        msg: "Product not found",
      })
    }

    res.status(200).json({
      success: true,
      msg: "Product status updated successfully",
      data: post,
    })
  } catch (error) {
    console.error("Error updating product status:", error)
    res.status(500).json({
      success: false,
      msg: error.message || "Internal server error",
    })
  }
}

// Update the addToCart controller function with backend price calculation
const addToCart = async (req, res) => {
  try {
    console.log("addToCart controller called with:", {
      body: req.body,
      clientId: req.client?.clientId,
      headers: {
        contentType: req.headers["content-type"],
        authorization: req.headers.authorization ? "Present" : "Missing",
      },
    })

    // Validate request
    if (!req.client || !req.client.clientId) {
      console.error("Missing client information in request")
      return res.status(400).json({
        error: "Bad Request",
        message: "Client information is missing",
        success: false,
      })
    }

    if (!req.body || !req.body.productId) {
      console.error("Missing productId in request body:", req.body)
      return res.status(400).json({
        error: "Bad Request",
        message: "Product ID is required",
        success: false,
      })
    }

    // Extract custom fields from request body
    const { productId, quantity = 1, customQuantity, customFinish, customThickness } = req.body

    // Validate custom finish if provided
    if (customFinish) {
      const validFinishes = ["polish", "leather", "flute", "river", "satin", "dual"]
      if (!validFinishes.includes(customFinish.toLowerCase())) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Invalid finish option. Must be one of: polish, leather, flute, river, satin, dual",
          success: false,
        })
      }
    }

    // Validate custom quantity if provided
    if (customQuantity !== undefined && (isNaN(customQuantity) || customQuantity < 0)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Custom quantity must be a positive number",
        success: false,
      })
    }

    // Get the product from database
    const product = await Post.findOne({ postId: productId })
    if (!product) {
      console.error(`Product not found with ID: ${productId}`)
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found",
        success: false,
      })
    }

    console.log(`Found product: ${product.name} (${product.postId})`)

    // Get client and agent information for price calculation
    const clientId = req.client.clientId
    let agentId = null

    if (req.isImpersonating && req.impersonatingAgent) {
      agentId = req.impersonatingAgent.agentId
    }

    // Calculate the final price with all commissions
    const priceCalculation = await calculateFinalPrice(product.price, product.category, clientId, agentId)

    console.log(`Calculated final price: ${priceCalculation.finalPrice} for product ${product.name}`)

    // Find or create cart
    let cart = await Cart.findOne({ clientId: req.client.clientId })

    if (!cart) {
      console.log(`No cart found for client ${req.client.clientId}, creating new cart`)
      cart = new Cart({
        clientId: req.client.clientId,
        items: [],
      })
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.postId && item.postId.toString() === productId.toString(),
    )

    // Get the quantity from request body, default to 1 if not provided
    const itemQuantity = quantity ? Number.parseInt(quantity) : 1
    console.log(`Adding product ${productId} to cart with quantity: ${itemQuantity}`)

    if (existingItemIndex >= 0) {
      // Update existing item - add the new quantity to the existing quantity
      console.log(
        `Product ${productId} already in cart, updating quantity from ${cart.items[existingItemIndex].quantity} to ${cart.items[existingItemIndex].quantity + itemQuantity}`,
      )
      cart.items[existingItemIndex].quantity += itemQuantity

      // Update price to use the calculated final price
      cart.items[existingItemIndex].price = priceCalculation.finalPrice
      cart.items[existingItemIndex].basePrice = product.price // Store the original price

      // Update custom fields if provided
      if (customQuantity !== undefined) {
        cart.items[existingItemIndex].customQuantity = customQuantity
      }
      if (customFinish !== undefined) {
        cart.items[existingItemIndex].customFinish = customFinish.toLowerCase()
      }
      if (customThickness !== undefined) {
        cart.items[existingItemIndex].customThickness = customThickness
      }

      console.log(`Updated cart item price to: ${priceCalculation.finalPrice} with custom fields`)
    } else {
      // Add new item
      console.log(
        `Adding new product ${productId} to cart with calculated price: ${priceCalculation.finalPrice}, quantity: ${itemQuantity}, and custom fields`,
      )

      // Ensure applicationAreas is valid
      const validApplicationAreas = ["Flooring", "Countertops", "Walls", "Exterior", "Interior"]
      const applicationAreas =
        Array.isArray(product.applicationAreas) && product.applicationAreas.length > 0
          ? product.applicationAreas
          : (product.applicationAreas || "").split(",").filter((area) => area.trim()).length > 0
            ? (product.applicationAreas || "").split(",").map((area) => area.trim())
            : ["Flooring"] // Default to Flooring if empty

      // Create the new cart item with calculated price
      const newItem = {
        postId: productId,
        name: product.name || "",
        price: priceCalculation.finalPrice, // Use calculated final price
        basePrice: product.price, // Store the original price
        category: product.category || "",
        applicationAreas: applicationAreas,
        description: product.description || "",
        image: product.image || [],
        quantity: itemQuantity, // Use the provided quantity
        commissionInfo: priceCalculation.commissionInfo, // Store commission breakdown
      }

      // Add custom fields if provided
      if (customQuantity !== undefined) {
        newItem.customQuantity = customQuantity
      }
      if (customFinish !== undefined) {
        newItem.customFinish = customFinish.toLowerCase()
      }
      if (customThickness !== undefined) {
        newItem.customThickness = customThickness
      }

      cart.items.push(newItem)
    }

    // Save cart
    await cart.save()
    console.log(`Cart saved successfully for client ${req.client.clientId}`)

    return res.status(200).json({
      data: { cart },
      message: "Product added to cart with calculated pricing and custom specifications",
      success: true,
    })
  } catch (error) {
    console.error("Error in addToCart controller:", error)
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message || "An unexpected error occurred",
      success: false,
    })
  }
}

// Add the clearCart controller function
const clearCart = async (req, res) => {
  try {
    console.log(`Clearing cart for client ${req.client.clientId}`)

    // Instead of using the service, let's handle this directly to fix the issue
    const result = await Cart.findOneAndUpdate(
      { clientId: req.client.clientId },
      { $set: { items: [] } },
      { new: true },
    )

    if (!result) {
      // If no cart exists, create an empty one
      const newCart = new Cart({
        clientId: req.client.clientId,
        items: [],
      })
      await newCart.save()
      return res.status(200).json({
        message: "New empty cart created",
        success: true,
      })
    }

    return res.status(200).json({
      message: "Cart cleared successfully",
      success: true,
    })
  } catch (error) {
    console.error("Error clearing cart:", error)
    return res.status(500).json({
      message: "Error while clearing cart",
      error: error.message,
      success: false,
    })
  }
}

const addToWishlist = async (req, res) => {
  try {
    const response = await addToWishlistService(req.body.productId, req.client.clientId)
    if (response) {
      res.status(StatusCodes.OK).send({
        data: response,
        message: "Product added to wishlist",
        success: true,
      })
    }
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
      message: error.message,
    })
  }
}

// Add this debug log at the beginning of the createCleint function
const createCleint = async (req, res) => {
  try {
    console.log("Request body:", req.body)
    const validatedPayload = clientBasicDetails.parse(req.body)
    validatedPayload.agentAffiliated = req.agent.email

    // Log all fields for debugging
    console.log("Client data being saved:", {
      name: validatedPayload.name,
      mobile: validatedPayload.mobile,
      email: validatedPayload.email || "",
      city: validatedPayload.city || "",
      profession: validatedPayload.profession || "",
      businessName: validatedPayload.businessName || "",
      gstNumber: validatedPayload.gstNumber || "",
      projectType: validatedPayload.projectType || "",
      dateOfBirth: validatedPayload.dateOfBirth || "",
      address: validatedPayload.address || "",
      consultantLevel: validatedPayload.consultantLevel || "red",
    })

    console.log("Validated payload:", validatedPayload)
    const response = await createClientService(validatedPayload, res)
    if (response) {
      return res.status(200).json({
        message: "Client details created successfully.",
        data: response,
      })
    }
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Validation error details:", error.errors)
      return res.status(400).json({
        message: "Validation failed.",
        errors: error.errors,
      })
    }

    console.error("Error in createClient:", error)
    return res.status(500).json({
      message: "An unexpected error occurred.",
      error: error.message,
    })
  }
}

const updateClientDetails = async (req, res) => {
  try {
    const validatedPayload = clientValidationSchema.parse(req.body)

    const response = await updateClientDetailsService(validatedPayload, req.client.clientId)

    return res.status(200).json({
      message: "Client details updated successfully.",
      data: response,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation failed.",
        errors: error.errors,
      })
    }

    return res.status(500).json({
      message: "An unexpected error occurred.",
      error: error.message,
    })
  }
}

const getUserCart = async (req, res) => {
  try {
    const response = await getCartService(req.client.clientId)
    return res.status(200).json({
      message: "Cart details fetched successfully",
      data: response,
    })
  } catch (error) {
    return res.status(500).json({
      message: "Error while fetching User cart details",
      error: error.message,
    })
  }
}

const getUserWishlist = async (req, res) => {
  try {
    const response = await getWishlistService(req.client.clientId)
    return res.status(200).json({
      message: "Wishlist details fetched successfully",
      data: response,
    })
  } catch (error) {
    return res.status(500).json({
      message: "Error while fetching User wishlist details",
      error: error.message,
    })
  }
}

const removeItemFromUserCart = async (req, res) => {
  try {
    const response = await removeFromCartService(req.body.productId, req.client.clientId)

    return res.status(200).json({
      data: response,
      success: true,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
      message: error.message,
    })
  }
}

const removeItemFromWishlist = async (req, res) => {
  try {
    console.log("removeItemFromWishlist called with request:", {
      body: req.body,
      client: req.client
        ? {
            clientId: req.client.clientId,
            role: req.client.role,
          }
        : null,
    })

    // Check if client object exists and has clientId
    if (!req.client || !req.client.clientId) {
      console.error("Invalid client object in request:", req.client)
      return res.status(400).json({
        message: "Invalid client information",
        success: false,
      })
    }

    // Check if productId exists in the request body
    if (!req.body.productId) {
      console.error("No productId provided in request body")
      return res.status(400).json({
        message: "Product ID is required",
        success: false,
      })
    }

    console.log(`Removing product ${req.body.productId} from wishlist for client ${req.client.clientId}`)

    const response = await removeItemFromWishlistService(req.body.productId, req.client.clientId)

    return res.status(200).json({
      message: "Item removed from wishlist successfully",
      data: response,
      success: true,
    })
  } catch (error) {
    console.error("Error while removing item from wishlist:", error)
    return res.status(500).json({
      message: "Error while removing item from wishlist",
      error: error.message,
      success: false,
    })
  }
}

const createAgent = async (req, res) => {
  try {
    agentRegisterSchema.parse(req.body)

    const response = await createAgentService(req.body)
    if (response) {
      const payload = {
        agentId: response.agentId,
        email: response.email,
        role: "agent",
      }
      const accessToken = generateAccessToken(payload)
      const refreshToken = generateRefreshToken(payload)

      res.status(200).send({
        accessToken,
        refreshToken,
        message: "Agent saved successfully",
        success: true,
      })
    }
  } catch (error) {
    console.log(error)
    if (error instanceof ZodError) {
      res.status(400).send({
        error: "Validation failed",
        details: error.errors,
      })
    } else if (error.code == 11000) {
      res.status(400).send({
        error: "Agent already exists",
        details: error.message,
      })
    } else {
      res.status(500).send({
        error: "Something went wrong",
        details: error.message,
      })
    }
  }
}

const loginAgent = async (req, res) => {
  try {
    const response = await loginAgentService(req.body)
    if (response) {
      res.status(200).send({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        message: "Agent logged in successfully",
        success: true,
      })
    } else {
      res.status(401).send({ message: "Invalid email or password", success: false })
    }
  } catch (error) {
    res.status(500).send({
      error: "Something went wrong",
      details: error.message,
    })
  }
}

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" })
    }

    // Verify the refresh token
    const decoded = verifyToken(refreshToken)

    // Generate new tokens
    const payload = {
      id: decoded.id,
      role: decoded.role,
    }

    const newAccessToken = generateAccessToken(payload)
    const newRefreshToken = generateRefreshToken(payload)

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      message: "Tokens refreshed successfully",
      success: true,
    })
  } catch (error) {
    res.status(401).json({
      message: "Invalid refresh token",
      error: error.message,
    })
  }
}

const getAllClient = async (req, res) => {
  try {
    const response = await getAllClientService()

    res.status(200).send({ data: response, message: "Clients fetched successfully" })
  } catch (error) {
    res.status(500).send({
      error: "Something went wrong",
      details: error.message,
    })
  }
}

// Get all clients for that agent
const getAllAssociatedClient = async (req, res) => {
  try {
    const response = await getAllAssociatedClientService(req.agent.email)
    res.status(200).send({ message: "Clients fetched successfully", data: response })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      error: "Something went wrong",
      details: error.message,
    })
  }
}

const getClientDetailsById = async (req, res) => {
  try {
    const response = await getClientDetailsByIdService(req.params.id)
    if (response) {
      res.status(200).send({
        message: "Client details fetched successfully",
        data: response,
      })
    } else {
      res.status(404).send({ message: "Client details not found for this ID" })
    }
  } catch (error) {
    console.log(error)
    res.status(500).send({
      error: "Something went wrong",
      details: error.message,
    })
  }
}

const getClientOrders = async (req, res) => {
  try {
    const response = await getClientOrdersService(req.params.clientId)
    res.status(200).send({
      message: "Client orders fetched successfully",
      data: response,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      error: "Something went wrong",
      details: error.message,
    })
  }
}

// New controller methods for orders
const createOrder = async (req, res) => {
  try {
    console.log("Create order request received:", {
      clientId: req.client?.clientId,
      body: req.body,
      timestamp: new Date().toISOString(),
    })

    const { shippingAddress, paymentMethod, notes } = req.body

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      })
    }

    // Get the client's cart
    const cart = await Cart.findOne({ clientId: req.client.clientId })
    console.log("Client cart found:", {
      clientId: req.client.clientId,
      cartExists: !!cart,
      itemsCount: cart?.items?.length || 0,
    })

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      })
    }

    // Check for null postId values in cart items
    const nullPostIdItems = cart.items.filter((item) => !item.postId)
    if (nullPostIdItems.length > 0) {
      console.error("Found items with null postId:", nullPostIdItems)

      // Remove items with null postId
      cart.items = cart.items.filter((item) => item.postId)
      await cart.save()

      if (cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cart contains invalid items. Please add valid products to your cart.",
        })
      }
    }

    // Get client details to find the agent
    const client = await clientModel.findOne({ clientId: req.client.clientId })
    console.log("Client details found:", {
      clientExists: !!client,
      agentAffiliated: client?.agentAffiliated,
    })

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      })
    }

    // Get agent details
    const agent = await agentModel.findOne({ email: client.agentAffiliated })
    console.log("Agent details found:", {
      agentExists: !!agent,
      agentId: agent?.agentId,
    })

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      })
    }

    // Calculate total amount using the prices already calculated in cart items
    const totalAmount = cart.items.reduce((total, item) => {
      return total + item.price * item.quantity
    }, 0)

    // Create new order with custom fields preserved and calculated prices
    const newOrder = new Order({
      clientId: req.client.clientId,
      agentId: agent.agentId,
      items: cart.items, // This will include custom fields and calculated prices
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || "bank_transfer",
      notes: notes || "",
      status: "pending",
      paymentStatus: "pending",
    })

    console.log("Creating new order with items:", {
      itemCount: newOrder.items.length,
      totalAmount: newOrder.totalAmount,
      hasCustomFields: newOrder.items.some((item) => item.customQuantity || item.customFinish || item.customThickness),
      hasCalculatedPrices: newOrder.items.some((item) => item.commissionInfo),
    })

    const savedOrder = await newOrder.save()
    console.log("Order created successfully:", {
      orderId: savedOrder.orderId,
    })

    // Clear the cart after successful order creation
    console.log("Clearing cart for client:", req.client.clientId)
    await Cart.findOneAndUpdate({ clientId: req.client.clientId }, { $set: { items: [] } })
    console.log("Cart cleared successfully")

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: savedOrder,
    })
  } catch (error) {
    console.error("Error creating order:", {
      error: error.message,
      stack: error.stack,
      clientId: req.client?.clientId,
    })

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create order",
      error: error.message,
    })
  }
}

const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params

    const order = await getOrderByIdService(orderId)

    res.status(200).json({
      success: true,
      data: order,
    })
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      success: false,
      message: error.message,
    })
  }
}

const updateOrderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      })
    }

    const order = await updateOrderStatusService(orderId, status)

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    })
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      success: false,
      message: error.message,
    })
  }
}

const updatePaymentStatusController = async (req, res) => {
  try {
    const { orderId } = req.params
    const { paymentStatus } = req.body

    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: "Payment status is required",
      })
    }

    const order = await updatePaymentStatusService(orderId, paymentStatus)

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      data: order,
    })
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      success: false,
      message: error.message,
    })
  }
}

const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params

    const result = await generateInvoiceService(orderId)

    res.status(200).json({
      success: true,
      message: "Invoice generated successfully",
      data: result,
    })
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      success: false,
      message: error.message,
    })
  }
}

// Agent impersonation
const impersonateClient = async (req, res) => {
  try {
    const { clientId } = req.params

    const result = await generateClientImpersonationToken(req.agent.agentId, clientId)

    res.status(200).json({
      success: true,
      message: "Impersonation token generated successfully",
      data: result,
    })
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      success: false,
      message: error.message,
    })
  }
}

// Analytics
const getAgentAnalyticsController = async (req, res) => {
  try {
    const analytics = await getAgentAnalytics(req.agent.agentId)

    res.status(200).json({
      success: true,
      data: analytics,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const getClientAnalyticsController = async (req, res) => {
  try {
    const analytics = await getClientAnalyticsService(req.client.clientId)

    res.status(200).json({
      success: true,
      data: analytics,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// Add this new controller function to expose the agent orders functionality
const getAgentClientOrders = async (req, res) => {
  try {
    const orders = await getAgentClientOrdersService(req.agent.agentId)

    res.status(200).json({
      success: true,
      message: "Agent orders fetched successfully",
      data: orders,
    })
  } catch (error) {
    console.error("Error fetching agent orders:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch agent orders",
    })
  }
}

// 🧹 CACHE CLEANUP: Clear expired cache entries
const clearExpiredCache = () => {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key)
    }
  }
}

// 🕐 SCHEDULE: Clear cache every 10 minutes
setInterval(clearExpiredCache, 10 * 60 * 1000)

// 🔄 KEEP-ALIVE: Health check endpoint
const keepAlive = (req, res) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cacheSize: cache.size,
  })
}

// 📊 ANALYTICS: Get product statistics
const getProductStats = async (req, res) => {
  try {
    const stats = await Post.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          totalStock: { $sum: "$stock" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ])

    const totalProducts = await Post.countDocuments()
    const totalValue = await Post.aggregate([
      { $group: { _id: null, total: { $sum: { $multiply: ["$price", "$stock"] } } } },
    ])

    res.status(200).json({
      success: true,
      data: {
        categoryStats: stats,
        totalProducts: totalProducts,
        totalInventoryValue: totalValue[0]?.total || 0,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ Error in getProductStats:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching product statistics",
      error: error.message,
    })
  }
}

// 🔍 SEARCH: Advanced product search
const searchProducts = async (req, res) => {
  try {
    const { query, filters, sort } = req.body

    const searchQuery = {}

    if (query) {
      searchQuery.$text = { $search: query }
    }

    if (filters) {
      if (filters.category) searchQuery.category = filters.category
      if (filters.priceRange) {
        searchQuery.price = {
          $gte: filters.priceRange.min || 0,
          $lte: filters.priceRange.max || Number.MAX_VALUE,
        }
      }
      if (filters.inStock) searchQuery.stock = { $gt: 0 }
    }

    const products = await Post.find(searchQuery)
      .sort(sort || { score: { $meta: "textScore" } })
      .limit(50)
      .lean()

    res.status(200).json({
      success: true,
      data: products,
      count: products.length,
    })
  } catch (error) {
    console.error("❌ Error in searchProducts:", error)
    res.status(500).json({
      success: false,
      message: "Error searching products",
      error: error.message,
    })
  }
}

// Export all the existing functions
module.exports = {
  // Include all the existing exports
  createPost,
  getUserCart,
  getUserWishlist,
  getPostDataById,
  getAllProducts,
  deleteProduct,
  updateProduct,
  updateProductStatus,
  addToCart, // This is the updated function
  addToWishlist,
  createCleint,
  updateClientDetails,
  removeItemFromUserCart,
  removeItemFromWishlist,
  createAgent,
  loginAgent,
  refreshToken,
  getAllClient,
  getAllAssociatedClient,
  getClientDetailsById,
  getClientOrders,
  createOrder,
  getOrderById,
  updateOrderStatusController,
  updatePaymentStatusController,
  generateInvoice,
  impersonateClient,
  getAgentAnalyticsController,
  getClientAnalyticsController,
  clearCart,
  getAgentClientOrders,
  keepAlive,
  getProductStats,
  searchProducts,
  clearExpiredCache,
}
