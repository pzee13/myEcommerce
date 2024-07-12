const mongoose = require('mongoose');
const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Cart = require("../models/cartModel")
const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
const Order = require("../models/orderModel")

const Razorpay = require("razorpay")
const bcrypt = require('bcryptjs')
const path = require("path")
const fs = require("fs")
const moment = require( 'moment' )


const calculateTodayIncome = async (today, now,next) => {
    try {
        const todayOrders = await Order.aggregate([
            {
                $match: {
                    orderDate: {
                        $gte: today,
                        $lt: now
                    },
                    'products.paymentStatus': {
                        $nin: ["Pending", "Failure","Canceled","Refunded"]
                    }
                }
            },
            {
                $unwind: '$products'
            },
            {
                $group: {
                    _id: null,
                    // Count total orders
                    todayRevenue: {
                        $sum: 
                            "$totalAmount"
                        
                    }
                }
            }
        ]);


        const todayIncomeValue = todayOrders.length > 0 ? todayOrders[0].todayRevenue : 0
       

        return todayIncomeValue 
    } catch (error) {
    
        next(error)
    }
};



const yesterdayIncome =  async ( today, yesterday) => {
    const yesterdayOrders = await Order.aggregate([
        { 
            $match : {
            orderDate : {
                            $gte : yesterday,
                            $lt : today
                        },
                        'products.paymentStatus': {
                            $nin: ["Pending", "Failure","Canceled","Refunded"]
                        }
        }
        },
        { 
            $unwind : "$products"
        },
        {
            $group : 
            {
                _id : null,
                yesterdayIncome : {
                    $sum : "$products.total"
                }
            }
        },
        {
            $project :
            {
                yesterdayIncome : 1
            }
        }
    ])
    const yesterdayIncome = yesterdayOrders.length > 0 ? yesterdayOrders[0].yesterdayIncome : 0
    return yesterdayIncome
}


const totalRevenue = async () =>  {

    const revenue = await Order.aggregate([
        {
         $match: {
                "products.paymentStatus": { $nin: ["Pending", "Failure","Canceled","Refunded"] }
            }
        },
        {
            $group : 
            {
                _id : null,
                revenue : 
                {
                    $sum : "$totalAmount"
                }
            }
        }
    ])

    const totalRevenue = revenue.length > 0 ? revenue[0].revenue : 0
    return totalRevenue
}

const currentMonthRevenue = async (currentMonthStartDate, now,next) => {
    try {
        const currentMonthRevenue = await Order.aggregate([
            {
                $match:
                {
                    orderDate:
                    {
                        $gte: currentMonthStartDate,
                        $lt: now
                    },
                    "products.paymentStatus":
                    {
                        $nin: ["Pending", "Failure","Canceled","Refunded"]
                    }
                }
            },
            {
                $group:
                {
                    _id: null,
                    currentMonthRevenue:
                    {
                        $sum: "$totalAmount"
                    }
                }
            }
        ]);

        

        const result = currentMonthRevenue.length > 0 ? currentMonthRevenue[0].currentMonthRevenue : 0;
        return result;
    } catch (error) {
  
      next(error)
    }
};

const previousMonthRevenue = async (previousMonthStartDate, previousMonthEndDate,next) => {
    try {
        const previousMonthRevenue = await Order.aggregate([
            {
                $match:
                {
                    orderDate:
                    {
                        $gte: previousMonthStartDate,
                        $lt: previousMonthEndDate
                    },
                    "products.paymentStatus":
                    {
                        $nin: ["Pending", "Failure","Canceled","Refunded"]
                    }
                }
            },
            {
                $group:
                {
                    _id: null,
                    previousMonthRevenue:
                    {
                        $sum: "$totalAmount"
                    }
                }
            }
        ]);

        

        const result = previousMonthRevenue.length > 0 ? previousMonthRevenue[0].previousMonthRevenue : 0;
        return result;
    } catch (error) {
        next(error)
    }
};


const paymentMethodAmount = async () => {
    const paymentMethodTotal = await Order.aggregate([
        {
            $match: {
                "products.paymentStatus": { $nin: ["Pending", "Failure","Canceled","Refunded"] }
            }
        },
        {
            $group : 
            {
                _id : "$paymentOption",
                amount : 
                {
                    $sum : "$totalAmount"
                }
            }
        }
    ]) 

    const result = {
        online: 0,
        wallet: 0,
        COD: 0,
    };

    paymentMethodTotal.forEach(option => {
        if (option._id === 'Online') {
            result.online = option.amount;
        } else if (option._id === 'Wallet') {
            result.wallet = option.amount;
        } else if (option._id === 'COD') {
            result.COD = option.amount;
        }
    });

    return result;
}



const categorySales = async () => {
    const catSales = await Order.aggregate([
        {
            $match: {
                "products.paymentStatus": { $nin: ["Pending", "Failure","Canceled","Refunded"] }
            }
        },
        {
            $unwind : "$products"
        },
        {
            $lookup :
            { 
                from : "products", 
                localField : "products.product_Id", 
                foreignField : "_id",
                as : "categories"
            }
        },
        {
            $unwind : "$categories"
        },
        {
            $lookup :
            { 
                from : "categories", 
                localField : "categories.category", 
                foreignField : "_id", 
                as: "category"
            } 
        },
        {
            $unwind : "$category"
        },
        {
            $group : 
                {
                _id: "$category.categoryName", 
                total : 
                    {
                        $sum : "$products.total"
                    }
                }
        }
    ])
    return catSales
}

const dailyChart = async () => {
    const dailyOrders = await Order.aggregate([
        {
            $match : {
                "products.paymentStatus" :  {
                    $nin: ["Pending", "Failure","Canceled","Refunded"]
                }
            }
        },
        {
            $group : {
                _id : {
                    $dateToString : {
                        format : "%Y-%m-%d",
                        date : "$orderDate"
                    },
                },
                dailyrevenue : {
                    $sum : "$totalAmount"
                }
            }
        },
        {
            $sort : {
                _id : 1
            }
        },
        {
            $limit : 7
        }
    ])

    const result =  dailyOrders || 0
    return result
}

// const getSalesReport = async (req, res ,next) => {
//     try {
//       var shortDateFormat = 'YYYY-MM-DD';
//       const {  from, to,seeAll, sortData, sortOrder } = req.query;
  

  
//       let page = Number(req.query.page) || 1;
//       const pag = {
//         SALES_PER_PAGE: 10, 
//       };
//       const conditions = {}
//         if( from && to){
//             conditions.date = {
//                 $gte : from,
//                 $lte : to
//             }
//         } else if ( from ) {
//             conditions.date = {
//                 $gte : from
//             }
//         } else if ( to ){
//             conditions.date = {
//                 $lte : to
//             }
//         }

//         const sort = {}
//         if( sortData ) {
//             if( sortOrder === "Ascending" ){
//                 sort[sortData] = 1
//             } else {
//                 sort[sortData] = -1
//             }
//         } else {
//             sort['date'] = -1
//         }
  
  
//       const orderCount = await Order.count();
//       const limit = seeAll === "seeAll" ? orderCount : pag.SALES_PER_PAGE;
//       const orders = await Order.find(conditions)
//         .populate('products.product_Id')
//         .sort({sort})
//         .skip((page - 1) * pag.SALES_PER_PAGE)
//         .limit(limit);
  
//       res.render('salesReport', {
//         admin: true,
//         orders: orders,
//         from : from,
//         to : to, 
//         seeAll: seeAll,
//         currentPage: page,
//         hasNextPage: page * pag.SALES_PER_PAGE < orderCount,
//         hasPrevPage: page > 1,
//         nextPage: page + 1,
//         prevPage: page - 1,
//         lastPage: Math.ceil(orderCount / pag.SALES_PER_PAGE),
//         sortData:sortData,
//         sortOrder:sortOrder
//       });
//     } catch (error) {
//       next(error)
//     }
//   };

const getSalesReport = async (req, res ,next) => {
    try {
      var shortDateFormat = 'YYYY-MM-DD';
      const { seeAll, sortData, sortOrder } = req.query;
  

  
      let page = Number(req.query.page) || 1;
      const pag = {
        SALES_PER_PAGE: 10, 
      };
  
  
      const orderCount = await Order.countDocuments();
      const limit = seeAll === "seeAll" ? orderCount : pag.SALES_PER_PAGE;
      const orders = await Order.find()
        .populate('products.product_Id')
        .sort({orderDate:-1})
        .skip((page - 1) * pag.SALES_PER_PAGE)
        .limit(limit);
  
      res.render('salesReport', {
        admin: true,
        orders: orders,
      
        seeAll: seeAll,
        currentPage: page,
        hasNextPage: page * pag.SALES_PER_PAGE < orderCount,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        prevPage: page - 1,
        lastPage: Math.ceil(orderCount / pag.SALES_PER_PAGE),
        sortData,
        sortOrder,
        moment,
        shortDateFormat,
    
      });
    } catch (error) {
      next(error)
    }
  };

const filterSalesReport =async (req, res,next) => {
    try {
      // Extract the fromDate and toDate from the request body
      const { fromDate, toDate } = req.body;

      var shortDateFormat = 'YYYY-MM-DD';

        const { seeAll, sortData, sortOrder } = req.query;

        let page = Number(req.query.page) || 1;
        const pag = {
            SALES_PER_PAGE: 10,
        };
  
      // Convert fromDate and toDate to Date objects if needed
      const fromDateObj = new Date(fromDate);
      const toDateObj = new Date(toDate);
        
      const orderCount = await Order.countDocuments();
      const limit = seeAll === "seeAll" ? orderCount : pag.SALES_PER_PAGE;
      // Query orders within the date range
      const orders = await Order.find({
        orderDate: { $gte: fromDateObj, $lte: toDateObj },
      }).populate('products.product_Id')
      .skip((page - 1) * pag.SALES_PER_PAGE)
      .exec();
  
      // Render your sales report page with the filtered orders
      res.render('salesReport', {
        admin: true,
        orders: orders,
      
        seeAll: seeAll,
        currentPage: page,
        hasNextPage: page * pag.SALES_PER_PAGE < orderCount,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        prevPage: page - 1,
        lastPage: Math.ceil(orderCount / pag.SALES_PER_PAGE),
        sortData,
        sortOrder,
        moment,
        shortDateFormat, fromDate, toDate });
  
    } catch (error) {
      // Handle errors appropriately
      next(error)
    }
  }


  

  const YearlyRevenue = async (currentYearStartDate, now) => {
        const currentYearRevenue = await Order.aggregate([
            {
                $match: {
                    orderDate: {
                        $gte: currentYearStartDate,
                        $lt: now
                    },
                    "products.paymentStatus": {
                        $nin: ["Pending", "Failure", "Canceled", "Refunded"]
                    }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$orderDate" } },
                    currentYearRevenue: {
                        $sum: "$totalAmount"
                    }
                }
            }
        ]);

   

        const result = currentYearRevenue.length > 0 ? currentYearRevenue[0].currentYearRevenue : 0;
        return result;
   
};

const monthlyChart = async () => {
    const monthlyOrders = await Order.aggregate([
        {
            $match: {
                "products.paymentStatus": {
                    $nin: ["Pending", "Failure", "Canceled", "Refunded"]
                }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: "%Y-%m",
                        date: "$orderDate"
                    },
                },
                monthlyRevenue: {
                    $sum: "$totalAmount"
                }
            }
        },
        {
            $sort: {
                _id: 1
            }
        },
        {
            $limit: 12
        }
    ]);

    const result = monthlyOrders || 0;
    return result;
};

const getMostSellingProducts = async (next) => {
    try {
      const pipeline = [
    
      {
        $unwind: "$products",
      },
      {
        $match: {
            "products.paymentStatus": {
                $nin: ["Pending", "Failure", "Canceled", "Refunded"]
            }
        }
      },
      {
        $group: {
          _id: "$products.product_Id",
          count: { $sum: "$products.quantity" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productData",
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 5, // Limit to the top 6 products
      },
    ];
  
      const mostSellingProducts = await Order.aggregate(pipeline);
     
      if(!mostSellingProducts){
        return 0
      }
      
      return mostSellingProducts;
    } catch (error) {
        next(error)
    }
  };


module.exports = {
    calculateTodayIncome,
    yesterdayIncome,
    totalRevenue,
    currentMonthRevenue,
    previousMonthRevenue,
    paymentMethodAmount,
    categorySales,
    dailyChart,
    getSalesReport,
    YearlyRevenue,
    monthlyChart,
    getMostSellingProducts,
    filterSalesReport
  
}