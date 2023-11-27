const mongoose = require('mongoose');
const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Cart = require("../models/cartModel")
const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
const Order = require("../models/orderModel")
const Razorpay = require("razorpay")
const bcrypt = require('bcrypt')
const path = require("path")
const Sales = require("../controllers/salesController")
const fs = require("fs")


const loadDashboard = async( req, res, next) => {
        
    try {
        const admin = req.session.admin_id

        const today = new Date();
        today.setHours( 0, 0, 0, 0 )
        const yesterday = new Date(today)
        yesterday.setDate( today.getDate() - 1 );
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentMonthStartDate = new Date(currentYear, currentMonth, 1, 0, 0, 0);
        const previousMonthStartDate = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0);
        const previousMonthEndDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);
        const currentYearStartDate = new Date(currentYear, 0, 1, 0, 0, 0)
        
        console.log('Today:', today);
        console.log('Yesterday:', yesterday);
        console.log('Now:', now);
        console.log('Current Month Start Date:', currentMonthStartDate);
        console.log('Previous Month Start Date:', previousMonthStartDate);
        console.log('Previous Month End Date:', previousMonthEndDate);
        console.log('Current year start date:', currentYearStartDate);
        
        const promises = [
            Sales.currentMonthRevenue( currentMonthStartDate, now ),
            Sales.previousMonthRevenue( previousMonthStartDate, previousMonthEndDate ),
            Sales.paymentMethodAmount(),
            Sales.calculateTodayIncome( today, now ),
            Sales.yesterdayIncome( today, yesterday ),
            Sales.totalRevenue(),
            Order.find({ "products.status" : "Order Placed" }).count(),
            Order.find({ "products.status" : "Delivered" }).count(),
            User.find({isBlock : false, isVerified : true}).count(),
            Product.find({status : true}).count(),
            Sales.dailyChart(),
            Sales.categorySales(),
            Sales.YearlyRevenue(currentYearStartDate, now),
            Sales.monthlyChart(currentYearStartDate, now)
        ]
        
        const results = await Promise.all( promises )

        const revenueCurrentMonth = results[0]
        const revenuePreviousMonth = results[1]
        const paymentMethodAmount = results[2]
        const todayIncome = results[3]
        const yesterdayIncome = results[4]
        const totalRevenue = results[5]
        const ordersToShip = results[6] 
        const completedOrders = results[7]
        const userCount = results[8]
        const productCount = results[9] 
        const dailyChart = results[10]
        const categorySales = results[11]
        const YearlyRevenue = results[12]
        const monthlyChart = results[13]

console.log('revenueCurrentMonth:', revenueCurrentMonth);
console.log('revenuePreviousMonth:', revenuePreviousMonth);
console.log('paymentMethodAmount:', paymentMethodAmount);
console.log('todayIncome:', todayIncome);
console.log('yesterdayIncome:', yesterdayIncome);
console.log('totalRevenue:', totalRevenue);
console.log('ordersToShip:', ordersToShip);
console.log('completedOrders:', completedOrders);
console.log('userCount:', userCount);
console.log('productCount:', productCount);
console.log('dailyChart:', dailyChart);
console.log('categorySales:', categorySales);
console.log('Yearly:',YearlyRevenue)
console.log('Monthlychart:',monthlyChart)

        console.log('paymentMethodAmount:', paymentMethodAmount);

        const razorPayAmount = paymentMethodAmount && paymentMethodAmount.online ? paymentMethodAmount.online.toString() : 0;
        const walletPayAmount = paymentMethodAmount && paymentMethodAmount.wallet ? paymentMethodAmount.wallet.toString() : 0;
        const codPayAmount = paymentMethodAmount && paymentMethodAmount.COD ? paymentMethodAmount.COD.toString() : 0;

        console.log("cod:", codPayAmount);
        console.log("wallet:", walletPayAmount);
        console.log("online:", razorPayAmount);
                
        const monthlyGrowth = revenuePreviousMonth === 0 ? 100 : ((( revenueCurrentMonth - revenuePreviousMonth ) / revenuePreviousMonth ) * 100).toFixed(1);

        const dailyGrowth = ((( todayIncome - yesterdayIncome ) / yesterdayIncome ) * 100).toFixed( 1 )  

        console.log("mongro:",monthlyGrowth)
        console.log("mongro:",dailyGrowth)

        res.render('dashboard', {
            admin : admin,
            todayIncome : todayIncome,
            dailyGrowth : dailyGrowth,
            totalRevenue : totalRevenue,
            revenueCurrentMonth : revenueCurrentMonth,
            monthlyGrowth : monthlyGrowth,
            razorPayAmount : razorPayAmount,
            codPayAmount : codPayAmount,
            walletPayAmount:walletPayAmount,
            userCount : userCount,
            ordersToShip : ordersToShip,
            completedOrders : completedOrders,
            productCount : productCount,
            dailyChart : dailyChart,
            categorySales : categorySales,
            YearlyRevenue:YearlyRevenue,
            monthlyChart:monthlyChart
        } )
    } catch (error) {
        next(error)

    }

}

module.exports = {
    loadDashboard
}
