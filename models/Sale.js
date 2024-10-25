const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
    article: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article',
        required: [true, 'Article reference is required']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%']
    }
});

const saleSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: [true, 'Client reference is required']
    },
    items: {
        type: [saleItemSchema],
        validate: [arr => arr.length > 0, 'Sale must have at least one item']
    },
    total: {
        type: Number,
        required: [true, 'Total is required'],
        min: [0, 'Total cannot be negative']
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'credit card', 'bank transfer'],
        default: 'cash'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    },
    invoice: String,
    deliveryType: {
        type: String,
        enum: ['In Store', 'Delivery', 'Pickup'],
        required: true
    },
    delivery: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Delivery',
        validate: {
            validator: function(v) {
                return (this.deliveryType === 'Delivery' && v) || (this.deliveryType !== 'Delivery' && !v);
            },
            message: props => `Delivery reference ${props.value} is invalid for the given delivery type!`
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
