//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');
mongoose.set('useFindAndModify', false);

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemSchema = new mongoose.Schema({
  name: String
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("list", listSchema);

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to Your Todo List !"
});

const item2 = new Item({
  name: "Hit the + button to add a new task ."
});

const item3 = new Item({
  name: "← Hit this to delete a task ."
});

const defaultItems = [item1, item2, item3];

app.get("/", function(request, response) {

  const day = date.getDate();

  Item.find({}, function(err, items) {

    if (items.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (!err) {
          console.log("Default items added successfully to the MongoDB database");
        }
      });
      response.redirect("/");
    } else {
      response.render("list", {
        listTitle: day,
        newListItems: items
      });
    }

  });
});

app.get("/:customListTitle", function(request, response) {
  const title = _.capitalize(request.params.customListTitle);

  List.findOne({
    name: title
  }, function(err, results) {
    if (!err) {
      if (!results) {

        const list = new List({
          name: title,
          items: defaultItems
        });
        list.save();
        response.redirect("/" + title);
      } else {
        response.render("list", {
          listTitle: results.name,
          newListItems: results.items
        });
      }
    }
  });
});

app.post("/", function(request, response) {

  const item = request.body.newItem;
  const list = request.body.list;

  const task = new Item({
    name: item
  });

  if (list === date.getDate()) {

    task.save();
    response.redirect("/");
  } else {
    List.findOne({
      name: list
    }, function(err, foundList) {
      foundList.items.push(task);
      foundList.save();
      response.redirect("/" + list);
    });
  }
});

app.post("/delete", function(request, response) {
  const checkedItemID = request.body.checkbox;
  const listTitle = request.body.title;

  if (listTitle === date.getDate()) {
    Item.findByIdAndRemove(checkedItemID, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Task deleted successfully");
        response.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({
      name: listTitle
    }, {
      $pull: {
        items: {
          _id: checkedItemID
        }
      }
    }, function(err, foundList) {
      if (err) {
        console.log(err);
      } else {
        console.log("Task deleted successfully");
        response.redirect("/" + listTitle);
      }
    });
  }

});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});