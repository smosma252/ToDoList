//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin:test123@cluster0.eadsf.mongodb.net/todolistDB?retryWrites=true&w=majority/todolistDB",
  { useNewURLParser: true });

//create a schema
const itemsSchema = new mongoose.Schema({
  job: String
});

//model the schema from the schema made
const Item = mongoose.model("Item", itemsSchema);

//Create new Items
const item1 = new Item({
  job: "Welcome to ToDo List"
});

const item2 = new Item({
  job: "Click + to Add Item"
});

const item3 = new Item({
  job: "<--- Click to Remove"
});


const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


//create array of job items and add to item
const defaultJobs = [item1, item2, item3];

app.get("/", function (req, res) {

  Item.find({}, (err, items) => {

    if (items.length === 0) {
      Item.insertMany(defaultJobs, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added Default ");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: items });
    }

  });

});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    job: itemName
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", function (req, res) {

  const listName = req.body.listName;

  if (listName === "Today") {
    Item.deleteOne({ _id: req.body.checkbox }, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully Deleted");
        res.redirect("/");
      }
    })
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: req.body.checkbox } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      });
  }

});


app.get("/:id", function (req, res) {

  const paramId = _.capitalize(req.params.id);

  List.findOne({ name: paramId }, function (err, result) {

    if (!err) {
      if (!result) {
        //Create a new List
        const list = new List({
          name: paramId,
          items: defaultJobs
        });

        list.save();
        res.redirect("/" + paramId);

      } else {
        //Show an existing List
        res.render("list", { listTitle: result.name, newListItems: result.items })
      }
    }

  })

});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
