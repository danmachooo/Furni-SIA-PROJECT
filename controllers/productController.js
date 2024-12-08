const Product = require('../models/product');
const fs = require('fs').promises; 
const path = require('path');

const ProductController = {
    create: async (req, res) => {
        const { name, description, price, stock_quantity, category_id, new_category } = req.body;
    
        // Input validation
        if (!name || !description || !price || stock_quantity === undefined) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
    
        try {
            let image_path = null;
            // Check if an image file is uploaded
            if (req.file) {
                image_path = req.file.filename; 
            }
    
            // Initialize category_id to the passed category_id
            let finalCategoryId = category_id ? parseInt(category_id) : null; 
    
            // Check if a new category is being added
            if (new_category) {
                const newCategory = await Product.addCategory(new_category.trim()); 
                finalCategoryId = newCategory.insertId; 
            }
    
            // Call the model to create the product
            await Product.create(
                name.trim(),
                description.trim(),
                parseFloat(price),
                image_path,
                parseInt(stock_quantity),
                finalCategoryId
            );
    
            // Respond with success message
            res.status(201).json({ message: 'Product created successfully.' });
        } catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({ message: 'Error creating product.', error: error.message });
        }
    },
    
    displayAllInAdmin: async (req, res) => {
        try {
            const products = await Product.findAllWithCategory();
            res.render('product_manager', { products, title: 'Product Manager' });
        } catch (error) {
            console.error('Error fetching products: ', error);
            res.status(500).send('Internal Server Error');
        }
    },

    getAll: async (req, res) => {
        try {
            const selectedCategoryId = req.query.categoryId || null; // Get the selected categoryId from the query
            const products = await Product.findAll(selectedCategoryId); // Fetch products based on the category
            const categories = await Product.getCategories(); // Fetch categories for the filter

            // Render the shop page with products and categories
            res.render('shop', {
                products,
                categories,
                selectedCategoryId, // Pass the selected categoryId to maintain the selected state
                title: 'Shop',
            });
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).send('Internal Server Error'); // Handle error response
        }
    },
    getByIdToAdmin: async (req, res) => {
        try {
            const productId = req.params.id;
            const product = await Product.findById(productId); // Fetch product by ID
            if (!product) {
                return res.status(404).json({ message: 'Product not found.' });
            }
            res.render('update_product', { product, title: product.name });
        } catch (error) {
            console.error('Error retrieving product:', error);
            res.status(500).json({ message: 'Error retrieving product.', error: error.message });
        }
    },


    getById: async (req, res) => {
        try {
            const productId = req.params.id;
            const product = await Product.findById(productId); // Fetch product by ID
            if (!product) {
                return res.status(404).json({ message: 'Product not found.' });
            }
            res.render('product', { product, title: product.name });
        } catch (error) {
            console.error('Error retrieving product:', error);
            res.status(500).json({ message: 'Error retrieving product.', error: error.message });
        }
    },

    update: async (req, res) => {
        const { id } = req.params;
        const updates = req.body;
    
        try {
            // Get the current product details to check if there's an existing image
            const product = await Product.findById(id);
            if (!product) {
                return res.status(404).json({ message: 'Product not found.' });
            }
    
            // Handle image update
            if (req.file) {
                const newImagePath = req.file.filename; // Get the new image path
    
                // Delete old image if exists
                if (product.image_path) {
                    const oldImagePath = path.join(__dirname, '../uploads', product.image_path);
                    try {
                        await fs.unlink(oldImagePath); // Use promises API for unlinking
                    } catch (err) {
                        console.error('Error deleting old image:', err);
                        // You might want to log the error or handle it based on your app's requirements
                    }
                }
    
                updates.image_path = newImagePath; // Update image_path with the new image
            } else if (!req.file && !updates.image_path) {
                // If no new image provided, retain the old image path
                updates.image_path = product.image_path;
            }
    
            // Proceed with the rest of the updates
            await Product.update(id, updates);
            
            // Optionally return the updated product details
            const updatedProduct = await Product.findById(id); // Fetch the updated product
            
            res.status(200).json({ message: 'Product updated successfully.', product: updatedProduct });
        } catch (error) {
            console.error('Error updating product:', error);
            res.status(500).json({ message: 'Error updating product.', error: error.message });
        }
    },
    

    delete: async (req, res) => {
        const { id } = req.params;

        try {
            await Product.delete(id);
            res.status(200).json({ success: true, message: 'Product deleted successfully.' });
        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({ success: false, message: 'Error deleting product.', error: error.message });
        }
    },

    addCategory: async (name) => {
        // Input validation
        if (!name || name.trim() === "") {
            throw new Error('Category name is required.');
        }
        
        const [result] = await pool.query('INSERT INTO categories (name) VALUES (?)', [name.trim()]); // Trim and validate input
        return result;
    },

    renderCreate: async (req, res) => {
        try {
            const categories = await Product.getCategories(); // Fetch categories for the filter
            res.render('add_product', { categories });
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).send('Internal Server Error');
        }
    },
    
    renderUpdate: async (req, res) => {
        const { id } = req.params; // Extract the product ID from the request parameters
        try {
            const categories = await Product.getCategories(); // Fetch categories for the filter
            const product = await Product.findById(id); // Fetch the existing product details
    
            if (!product) {
                return res.status(404).send('Product not found.'); // Handle case where product does not exist
            }
    
            res.render('update_product', { categories, product }); // Pass the product details to the view for pre-population
        } catch (error) {
            console.error('Error fetching product or categories:', error);
            res.status(500).send('Internal Server Error');
        }
    }
};

module.exports = ProductController;
