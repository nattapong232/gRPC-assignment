require("dotenv").config();
const Menu = require("./models/menu");
const mongoose = require("mongoose");

mongoose.set("strictQuery", true);
mongoose.connect(process.env.DATABASE_URL);
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to Database"));

const PROTO_PATH = "./restaurant.proto";

//var grpc = require("grpc");
var grpc = require("@grpc/grpc-js");

var protoLoader = require("@grpc/proto-loader");

var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  arrays: true,
});

var restaurantProto = grpc.loadPackageDefinition(packageDefinition);

const { v4: uuidv4 } = require("uuid");

const server = new grpc.Server();
// const menu=[
//     {
//         id: "a68b823c-7ca6-44bc-b721-fb4d5312cafc",
//         name: "Tomyam Gung",
//         price: 500
//     },
//     {
//         id: "34415c7c-f82d-4e44-88ca-ae2a1aaa92b7",
//         name: "Somtam",
//         price: 60
//     },
//     {
//         id: "8551887c-f82d-4e44-88ca-ae2a1ccc92b7",
//         name: "Pad-Thai",
//         price: 120
//     }
// ];

server.addService(restaurantProto.RestaurantService.service, {
  getAllMenu: async (_, callback) => {
    const menu = await Menu.find();
    callback(null, { menu });
  },
  get: async (call, callback) => {
    let menuItem = await Menu.findById(call.request.id);
    console.log("menuItem", menuItem);
    // let menuItem = menu.find(n=>n.id==call.request.id);
    if (menuItem) {
      callback(null, menuItem);
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "Not found",
      });
    }
  },
  insert: async (call, callback) => {
    const menuItem = new Menu({
      name: call.request.name,
      price: call.request.price,
    });
    const newMenu = await menuItem.save();
    callback(null, newMenu);
  },
  update: async (call, callback) => {
    let existingMenuItem = await Menu.findById({ _id: call.request.id });
    if (existingMenuItem) {
      existingMenuItem.name = call.request.name;
      existingMenuItem.price = call.request.price;
      await existingMenuItem.save();
      callback(null, existingMenuItem);
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "Not Found",
      });
    }
  },
  remove: async (call, callback) => {
    const deletedMenu = await Menu.findByIdAndDelete({ _id: call.request.id });
    if (deletedMenu) {
      callback(null, {});
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "NOT Found",
      });
    }
  },
});

const port = process.env.GRPC_PORT || 30043;

server.bindAsync(
  `127.0.0.1:${port}`,
  grpc.ServerCredentials.createInsecure(),
  () => {
    server.start();
  }
);
console.log(`Server running at http://127.0.0.1:${port}`);
