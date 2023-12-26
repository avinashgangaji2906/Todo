//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todoListDB", {
  useNewUrlParser: true,
});
const itemsSchema = new mongoose.Schema({
  name: String,
});
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todoList!",
});
const item2 = new Item({
  name: "Hit + to add new item",
});
const item3 = new Item({
  name: "<<-- Click this to delete item",
});
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model("List", listSchema);
const insertAllItems = async () => {
  await Item.insertMany(defaultItems);
  console.log("items added succesfully in DB");
};

app.get("/", function (req, res) {
  Item.find({})
    .then(function (foundItems) {
      if (foundItems.length == 0) {
        insertAllItems();
        res.redirect("/");
      } else {
        res.render("list", {
          listTitle: "Today",
          newListItems: foundItems,
        });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }).then(function (foundItem) {
    if (!foundItem) {
      // save the list in list collection
      const list = new List({
        // list collection
        name: customListName,
        items: defaultItems,
      });

      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {
        listTitle: foundItem.name,
        newListItems: foundItem.items,
      });
    }
  });
});

app.post("/", function (req, res) {
  const newItem = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: newItem,
  });
  if (listName === "Today") {
    // stoing item in items collection
    item.save();
    console.log("new item added in Items");
    res.redirect("/");
  } else {
    // storing item in list collection
    List.findOne({ name: listName }).then(function (foundList) {
      foundList.items.push(item);
      foundList.save();
      console.log("new item added in " + listName);
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkItemId = req.body.checkbox;
  const listName = req.body.checked;
  if (listName === "Today") {
    // deleting item from items collection
    Item.findByIdAndRemove(checkItemId)
      .then(function () {
        console.log("Item deleted from items");
        res.redirect("/");
      })
      .catch(function (err) {
        console.log(err);
      });
  } else {
    // deleting item from list collection
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkItemId } } }
    ).then(function () {
      console.log("Item deleted from " + listName);
      res.redirect("/" + listName);
    });
  }
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
