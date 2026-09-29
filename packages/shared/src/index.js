// Central export of all @decorjoy/shared schemas, types, and utilities

const orderSchemas = require("./schemas/orderSchema");
const quoteSchemas = require("./schemas/quoteSchema");
const productSchemas = require("./schemas/productSchema");
const formSchemas = require("./schemas/formSchema");
const availabilitySchemas = require("./schemas/availabilitySchema");
const authSchemas = require("./schemas/authSchema");
const settingsSchemas = require("./schemas/settingsSchema");

const moneyUtils = require("./utils/money");
const phoneUtils = require("./utils/phone");
const dateUtils = require("./utils/date");

module.exports = {
  ...orderSchemas,
  ...quoteSchemas,
  ...productSchemas,
  ...formSchemas,
  ...availabilitySchemas,
  ...authSchemas,
  ...settingsSchemas,
  ...moneyUtils,
  ...phoneUtils,
  ...dateUtils,
};
