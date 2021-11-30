const path = require("path");

const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

//lots of validation middleware below.....

//if missing Name
function nameExists(req, res, next) {
  const { data: { name } = {} } = req.body;
  if (name) {
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a name",
  });
}
//description  missing or empty ''
function descriptionExists(req, res, next) {
  const { data: { description } = {} } = req.body;
  if (description) {
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a description",
  });
}
//price missing or  <=0
function priceExists(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price){
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a price",
  });
}
//if price greaterthan 0
function priceGreaterThanZero(req,res,next){
  const {data:{price}={}}=req.body;
  if(price > 0){
    return next();
  }
  next({
    status:400,
    message:'Dish must have a price that is an integer greater than 0'
  })
}

//if names match
function namesMatch(req,res,next){
    let dish=res.locals.dish
  const {data:{id,name}={}}=req.body;
  if(!id){
    if(name ===dish.name ){return next();}
  }
}

//if price is integer
function priceIsInteger(req,res,next){
  const {data:{price}={}}=req.body;
  if(Number.isInteger(price)){
    return next();
  }
  next({
    status:400,
    message:'Dish must have a price that is an integer greater than 0'
  })
}

//if imgUrl missing or empty ""
function imgUrlExists(req,res,next){
  const {data:{image_url}={}}=req.body;
  if(image_url){
    return next();
  }
  next({
    status:400,
    message:'Dish must include a image_url'
  })
}

//increments id
let lastDishId = dishes.reduce((maxId, dish) => Math.max(maxId, dish.id), 0);

//if dish exists
function dishExists(req,res,next){
  const {dishId}=req.params;
  const foundDish = dishes.find((dish)=>dish.id=== dishId); 
    if(foundDish){
    res.locals.dish=foundDish;
    return next();
  }
  next({
    status:404,
    message:`Dish id not found: ${dishId}`,
  })
}

//if ids don't match
function dishIdMismatch(req,res,next){
    const{dishId} = req.params
      const dish = res.locals.dish;
    const originalDish = dish.id;
    const {data:{id}={}}=req.body;
  if( !id){return next()}
  if (dishId !== id){
    return next({
      status:400,
      message:`Dish id does not match route id.Dish: ${id}, Route:${dish.id}`
    })
  }  next();
}

//if req.body has all properties
function bodyHasRequiredProperty(req,res,next){
   const {data:{id,name,description,image_url,price}={}} =req.body;

  if(!name){
     return next({
       status:400,
       message:"A 'name' property is required.",
     });
  }

  if(!description){
     return next({
       status:400,
       message:"A 'description' property is required.",
     });
  }

  if(!image_url){
     return next({
       status:400,
       message:"A 'image_url' property is required.",
     });
  }

  if(!price){
     return next({
       status:400,
       message:"A 'price' property is required.",
     });
  }

return next();
}

//main crudl functions
 //create
function create(req, res) {
  const { data: { name,
                 description,
                 price,
                 img_url
                } = {} } = req.body;
  const newDish = {
    id: ++lastDishId, // Increment last ID, then assign as the current ID
    name:name,
    description:description,
    price:price,
    img_url:img_url,    
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

//read
function read(request, response, next) {
  response.json({ data: response.locals.dish });
 }


//update
function update(req, res) {
    const {dishId} = req.params
    let dish = res.locals.dish;
    const {data:{id,name,description,image_url,price
   }={}}=req.body;
  let newGoodDish ={
    id,
    name,
    description,
    image_url,
    price,
  }
  if(dish !== newGoodDish){
    if(!newGoodDish.id){newGoodDish.id=dish.id}
    if(!newGoodDish.name){newGoodDish.name=dish.name}
    if(!newGoodDish.description){newGoodDish.description=dish.description}
    if(!newGoodDish.image_url){newGoodDish.image_url=dish.image_url}
    if(!newGoodDish.price){newGoodDish.price = dish.price}
             dish = newGoodDish
         
        res.json({data:dish})
  }
  res.json({data:dish})
}

//list
function list(req, res) {
  res.json({ data: dishes });
}

module.exports = {
                 read:[dishExists,read],
                 create:[
                         nameExists,
                         descriptionExists,
                         priceExists,
                         priceGreaterThanZero,
                         priceIsInteger,
                         imgUrlExists,
                         create
                         ],
                 update:[
                         dishExists,
                         nameExists,
                         descriptionExists,
                         priceExists,
                         priceGreaterThanZero,
                         priceIsInteger,
                         imgUrlExists,
                         bodyHasRequiredProperty,
                         dishIdMismatch,
                         update
                         ],
                 list,
                 }