const Check = require("./commands/check");
const Export = require("./commands/export");

var error = process.stderr.write.bind(process.stderr);

function capitalize(string) {
  return typeof string === "string" && string ?
    string.slice(0, 1).toUpperCase() + string.slice(1) :
    string;
}

var Commands = {
  run: function(name, options) {
    var Command = this[capitalize(name)];
    if (Command) {
      return (new Command(options || {})).run();
    } else {
      error("unknown command " + name + "\n");
    }
    return false;
  },

  Check: Check,
  Export: Export
};

module.exports = Commands;
