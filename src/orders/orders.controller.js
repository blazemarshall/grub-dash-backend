const path = require("path");
const router = require("./orders.router");
const controller = require("./orders.controller");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

//lots of validation middleware below-----------------------------

//if deliverTo exists
function deliverToExists(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;
  if (deliverTo) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include a deliverTo",
  });
}

//if mobileNumber exists
function mobileNumExists(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;
  if (mobileNumber) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include a mobileNumber",
  });
}

//if Dishes exists
function dishesExists(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (dishes) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include a dish",
  });
}

//if dishes array empty
function dishesArrayEmpty(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (dishes.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include at least one1 dish",
  });
}

//if dish is missing quantity
function dishMissingQuant(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  for (let i = 0; i < dishes.length; i++) {
    if (dishes[i].quantity === undefined || dishes[i].quantity <= 0)
      next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
  }
  next();
}

//if dish quantity is not an integer
function dishQuantNotInteger(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  for (let i = 0; i < dishes.length; i++) {
    if (!Number.isInteger(dishes[i].quantity))
      next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
  }
  next();
}

//if dishes are not an array
function dishesNotArray(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (Array.isArray(dishes)) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include at least one dish",
  });
}

//if order Id does not match route id
function orderIdMismatch(req, res, next) {
  const { orderId } = req.params;
  const order = res.locals.order;
  const { data: { id } = {} } = req.body;
  if (!id) {
    return next();
  }
  if (orderId !== id) {
    return next({
      status: 400,
      message: `Order id does not match route id.Dish: ${id}, Route:${order.id}`,
    });
  }
  next();
}

//if status missing
function missingStatus(req, res, next) {
  const { orderId } = req.params;
  const order = res.locals.order;
  const { data: { status } = {} } = req.body;
  if (!status || status === "invalid") {
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  }
  next();
}

//bodyHasProps helper
function validate(data) {
  const requiredProperties = ["deliverTo", "mobileNumber", "status", "dishes"];
  for (let field of requiredProperties) {
    if (!data[field]) {
      return {
        status: 400,
        message: `A ${field} property is required.`,
      };
    }
  }
}

// if bodyHasProps Main func
function bodyHasRequiredProperty(req, res, next) {
  const { data } = req.body;
  const varied = validate(data);
  if (varied) return next(varied);
  return next();
}

//if Status is pending
function statusPending(req, res, next) {
  const pendingOrder = res.locals.order;
  if (pendingOrder.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
}

//  crudl functions   --------------------------------------------------
function create(req, res) {
  //finds latest orderId
  let lastOrderId = orders.reduce(
    (maxId, order) => Math.max(maxId, order.id),
    0
  );

  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: ++lastOrderId,
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

// read
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

//read
function readOrder(req, res) {
  res.json({ data: res.locals.order });
}

//list
function list(req, res) {
  res.json({ data: orders });
}

//update
function update(req, res) {
  let order = res.locals.order;
  const { data } = req.body;
  order = { ...data, id: order.id };
  res.json({ data: order });
}

//destroy function
function destroy(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [
    deliverToExists,
    mobileNumExists,
    dishesExists,
    dishesNotArray,
    dishesArrayEmpty,
    dishMissingQuant,
    dishQuantNotInteger,
    create,
  ],
  readOrder: [orderExists, readOrder],
  update: [
    orderExists,
    orderIdMismatch,
    missingStatus,
    deliverToExists,
    mobileNumExists,
    dishesExists,
    dishesNotArray,
    dishesArrayEmpty,
    dishMissingQuant,
    dishQuantNotInteger,
    bodyHasRequiredProperty,
    update,
  ],
  destroy: [orderExists, statusPending, destroy],
};
