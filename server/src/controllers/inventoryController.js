
const Product = require('../models/product');

exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.findAll();
        res.status(200).json({ products });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ product });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, category, price, stock_quantity, expiry_date } = req.body;

        if (!name || !category || !price || !stock_quantity || !expiry_date) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const product = await Product.create({
            name,
            category,
            price,
            stock_quantity,
            expiry_date
        });

        res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
        res.status(500).json({ message: 'Error creating product', error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await product.update(req.body);
        res.status(200).json({ message: 'Product updated successfully', product });
    } catch (error) {
        res.status(500).json({ message: 'Error updating product', error: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await product.destroy();
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
};

exports.getLowStockProducts = async (req, res) => {
    try {
        const lowStockThreshold = 10;
        const products = await Product.findAll({
            where: {
                stock_quantity: { [require('sequelize').Op.lte]: lowStockThreshold }
            }
        });
        res.status(200).json({ products });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching low stock products', error: error.message });
    }
};

exports.batchImportProducts = async (req, res) => {
    try {
        const { products } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: 'No products provided for import' });
        }

        const importedProducts = [];
        const errors = [];
        let importedCount = 0;

        for (let i = 0; i < products.length; i++) {
            try {
                const { name, category, price, stock_quantity, expiry_date } = products[i];

                // Validate required fields
                if (!name || !category || !price || !stock_quantity) {
                    errors.push(`Row ${i + 1}: Missing required fields`);
                    continue;
                }

                // Validate price and stock_quantity
                if (isNaN(price) || parseFloat(price) < 0) {
                    errors.push(`Row ${i + 1}: Invalid price`);
                    continue;
                }

                if (isNaN(stock_quantity) || parseInt(stock_quantity) < 0) {
                    errors.push(`Row ${i + 1}: Invalid stock quantity`);
                    continue;
                }

                // Create product
                const product = await Product.create({
                    name: String(name).trim(),
                    category: String(category).trim(),
                    price: parseFloat(price),
                    stock_quantity: parseInt(stock_quantity),
                    expiry_date: expiry_date && expiry_date.trim() ? expiry_date : null
                });

                importedProducts.push(product);
                importedCount++;
            } catch (error) {
                errors.push(`Row ${i + 1}: ${error.message}`);
            }
        }

        res.status(201).json({
            message: `Batch import completed. ${importedCount} products imported successfully.`,
            importedCount,
            errorCount: errors.length,
            errors: errors.length > 0 ? errors : undefined,
            products: importedProducts
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error importing products',
            error: error.message
        });
    }
};
