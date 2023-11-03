var express = require('express');
var router = express.Router();
const AWS = require("aws-sdk");
const s3 = new AWS.S3()
const CyclicDb = require("@cyclic.sh/dynamodb")
const db = CyclicDb("vast-loincloth-flyCyclicDB")
let dishesCollection = db.collection('dishes')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/json', async(req, res) => {
  let my_file = await s3.getObject({
    Bucket: process.env.CYCLIC_BUCKET_NAME,
    Key: "content.json",
  }).promise()
  const result = JSON.parse(my_file.Body)?.content
  if(result == null) {
    res.json({
      status: "fail"
    });  
  }
  else {
    res.json({
      status: "success",
      content: result,
    });  
  }
});

router.post('/json', async (req, res) => {
  const {content} = req.body;
  const contentObject = {
    content: content
  }
  await s3.putObject({
    Body: JSON.stringify(contentObject, null, 2),
    Bucket: process.env.CYCLIC_BUCKET_NAME,
    Key: "content.json"
  }).promise()
  res.json({
    status: "success",
    content: content
  })
});

router.get('/dishes', async(req, res) => {
  let dishes = await dishesCollection.get("dishes")
  console.log(dishes)	
  if(dishes == null) {
    res.json({
      status: "fail"
    });
  }
else {
    res.json({
      status: "success",
      dishes: dishes.props
    });
  }
});

router.post('/dishes', async (req, res) => {
  const { dishName, country } = req.body; // Assuming dishName and country are part of the POST request

  let existingDishes = await dishesCollection.get("dishes");

  if (existingDishes == null) {
    // If the "dishes" object doesn't exist, create it with the first dish
    await dishesCollection.set("dishes", {
      [dishName]: {
        name: dishName,
        country: country
      }
    });
  } else {
    // If the "dishes" object exists, add the new dish to it
    existingDishes.props[dishName] = {
      name: dishName,
      country: country
    };

    await dishesCollection.set("dishes", existingDishes.props);
  }

  res.json({
    status: "success",
    dish: {
      name: dishName,
      country: country
    }
  });
});

  router.get('/dishes/:dishKey', async(req, res) => {
    return 	
    });

module.exports = router;


/*  Create an Express application with the following endpoints:
    /json:
    POST – Saves text in the JSON file.
    GET – Gets text saved in the JSON file.

    /dishes:
    POST – Adds a new dish to the database.
    GET – Gets a list of all the dishes.

    /dishes/:dishKey:
    GET – Gets details of dishes of the provided key.

    Each dish has name and country fields. The country field represents the country it comes from. 
    You can assume data from the request will be in the correct format. If the client tries to add an existing dish, override it. 
    The POST request to the /json endpoint should specify the text in the “content” property in the request’s body.
    
    Implement Cyclic.sh basic auth so access to the /json endpoint is provided only to authorised users.

    You should use DynamoDB and the S3 store to implement the endpoints. */