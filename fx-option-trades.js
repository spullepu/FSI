const { MongoClient } = require("mongodb");
const ObjectId =  require('mongodb').ObjectId;
// Replace the uri string with your connection string.
const uri =  'mongodb+srv://<>:<>@ist-shared.n0kts.mongodb.net/CLM';

const client = new MongoClient(uri);
async function run() {
  try {
    const database = client.db('CLM');
    const fx_trades = database.collection('fx-option-trade-book');

// CREATE fx option trade with delta exchange
/*
    const newDocument = {
  "_id": new ObjectId("5fd92e617c5f470df5fbded5"),"trade_id": "TRD-001","product": "EUR/USD","direction": "Buy","quantity": 100000,"price": 1.2000,"trade_date": new Date("2020-12-15T00:00:00Z"),
  "maturity_date": new Date("2021-03-15T00:00:00Z"),
  "underlying_price": 1.1950,
  "delta": 0.50,
  "gamma": 0.05,
  "vega": 0.02,
  "theta": -0.01,
  "hedge_id": "HDG-001",
  "hedge_quantity": -50000,
  "hedge_price": 1.1970,
  "hedge_date": new Date ("2020-12-15T00:00:00Z"),
  "hedge_type": "Sell"
};
*/
const newDocument = 
{
  "_id": new ObjectId("606e7f25b77ab857dcc2ba9a"),
  "trade_id": "DE-FXOPT-001",
  "trade_date": new Date("2023-03-15T00:00:00Z"),
  "expiry_date": new Date("2023-06-15T00:00:00Z"),
  "option_type": "Call",
  "underlying": "EUR/USD",
  "notional_amount": 1000000,
  "strike_price": 1.19,
  "premium": 5000,
  "delta": 0.4,
  "counterparty": "ABC Bank",
  "trader": "John Smith",
  "status": "Open",
  "hedges": [
     {
        "hedge_id": "DE-FXOPT-001-HG-01",
        "hedge_type": "Spot",
        "hedge_date": new Date("2023-03-15T00:00:00Z"),
        "hedge_amount": -400000,
        "hedge_price": 1.18
     },
     {
        "hedge_id": "DE-FXOPT-001-HG-02",
        "hedge_type": "Futures",
        "hedge_date": new Date("2023-03-16T00:00:00Z"),
        "hedge_amount": -600000,
        "hedge_price": 1.17
     }
  ]
}

const trade = await fx_trades.insertOne(newDocument);
console.log(trade);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);



