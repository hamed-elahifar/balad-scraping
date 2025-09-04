import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  title: String,
  address: String,
  website: String,
  phone: String,
  city: String,
  category: String,
  url: String,
});

const urlSchema = new mongoose.Schema({
  type: String,
  cat: String,
  city: String,
  page: Number,
  status: String,
});

urlSchema.virtual("url").get(function () {
  return `https://balad.ir/city-${
    this.city
  }/cat-${this.cat}?page=${this.page || 1}`;
});

// Ensure virtuals are included when converting to JSON or Object
urlSchema.set("toJSON", { virtuals: true });
urlSchema.set("toObject", { virtuals: true });

export const Item = mongoose.model("Item", itemSchema);
export const Url = mongoose.model("Url", urlSchema);
