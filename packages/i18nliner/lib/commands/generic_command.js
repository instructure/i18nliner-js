function GenericCommand(options) {
  this.options = options;
  if (this.options.silent) {
    this.print = function(){};
  }
}

GenericCommand.prototype.print = function(string, level) {
  if(level === 'error') {
    process.stderr.write(string);
  } else {
    process.stdout.write(string);
  }
};

module.exports = GenericCommand;
