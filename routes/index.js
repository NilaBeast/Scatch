const express = require('express');
const router = express.Router();
const isloggedin = require('../middlewares/isLoggedin');
const productModel = require('../models/product-model');
const userModel = require('../models/user-model');

router.get('/', (req, res) => {
    let error = req.flash('error');
    let success = req.flash('success');
    res.render('index', {error, success, loggedin: false});
});

router.get('/shop', isloggedin, async (req, res) => {
    try {
        const sortBy = req.query.sortby;
        const filter = req.query.filter;
        let sortOptions = {};
        let filterQuery = {};

        // Sorting logic
        if (sortBy === 'newest') {
            sortOptions = { createdAt: -1 };
        } else if (sortBy === 'popular') {
            sortOptions = { sold: -1 };
        } else if (sortBy === 'priceAsc') {
            sortOptions = { price: 1 };
        } else if (sortBy === 'priceDesc') {
            sortOptions = { price: -1 };
        }

        // Filtering logic
        if (filter === 'new') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            filterQuery.createdAt = { $gte: thirtyDaysAgo };
        } else if (filter === 'discount') {
            filterQuery.discount = { $gt: 0 };
        }

        const products = await productModel.find(filterQuery).sort(sortOptions);

        res.render('shop', {
            products,
            success: req.flash("success"),
            sortby: sortBy || '',
            filter: filter || ''
        });

    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to load shop.");
        res.redirect('/');
    }
});



router.get('/cart', isloggedin, async (req, res) => {
    try {
        const user = await userModel
            .findOne({ email: req.user.email })
            .populate("cart.product");

        if (!user || !user.cart || user.cart.length === 0) {
            return res.render("cart", {
                user,
                itemBills: [],
                overallTotal: 0,
                emptyCartMessage: "No items added to cart."
            });
        }

        let itemBills = [];
        let overallTotal = 0;

        user.cart.forEach(cartItem => {
            const item = cartItem.product;
            const price = Number(item.price || 0);
            const discount = Number(item.discount || 0);
            const quantity = cartItem.quantity;
            const platformFee = 20;
            const itemTotal = (price - discount + platformFee) * quantity;

            itemBills.push({
                item,
                price,
                discount,
                quantity,
                platformFee,
                total: itemTotal
            });

            overallTotal += itemTotal;
        });

        res.render('cart', {
            user,
            itemBills,
            overallTotal,
            emptyCartMessage: null
        });
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong while loading your cart.");
        res.redirect("/products");
    }
});

router.get('/addtocart/:productid', isloggedin, async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.user.email });
        const productId = req.params.productid;

        const existingItem = user.cart.find(item => item.product.toString() === productId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            user.cart.push({ product: productId, quantity: 1 });
        }

        await user.save();
        req.flash("success", "Item added to cart!");
        res.redirect("/shop");
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong.");
        res.redirect("/shop");
    }
});

// Increase quantity
// Increase quantity
router.get('/cart/increase/:productid', isloggedin, async (req, res) => {
  const user = await userModel.findOne({ email: req.user.email }).populate('cart.product');
  const item = user.cart.find(i => i.product._id.toString() === req.params.productid);

  if (item) {
    item.quantity += 1;
    await user.save();

    const price = Number(item.product.price || 0);
    const discount = Number(item.product.discount || 0);
    const platformFee = 20;
    const totalPrice = (price - discount + platformFee) * item.quantity;

    return res.json({
      success: true,
      quantity: item.quantity,
      totalPrice: totalPrice
    });
  }

  res.json({ success: false });
});

// Decrease quantity
router.get('/cart/decrease/:productid', isloggedin, async (req, res) => {
  const user = await userModel.findOne({ email: req.user.email }).populate('cart.product');
  const item = user.cart.find(i => i.product._id.toString() === req.params.productid);

  if (item) {
    item.quantity = Math.max(1, item.quantity - 1);
    await user.save();

    const price = Number(item.product.price || 0);
    const discount = Number(item.product.discount || 0);
    const platformFee = 20;
    const totalPrice = (price - discount + platformFee) * item.quantity;

    return res.json({
      success: true,
      quantity: item.quantity,
      totalPrice: totalPrice
    });
  }

  res.json({ success: false });
});

router.get('/removefromcart/:productId', isloggedin, async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.user.email });

        user.cart = user.cart.filter(item => item.product.toString() !== req.params.productId);
        await user.save();

        if (user.cart.length === 0) {
            req.flash("info", "Your cart is now empty. Redirecting to shop.");
            return res.redirect("/shop");
        }

        req.flash("success", "Item removed from cart.");
        res.redirect("/cart");
    } catch (err) {
        console.error(err);
        req.flash("error", "Could not remove item.");
        res.redirect("/cart");
    }
});

router.get('/profile', isloggedin, (req, res) => {
    res.render('myAccount', { user: req.user });
});


router.get('/logout', isloggedin, (req, res) => {
    res.render('shop');
});

module.exports = router;