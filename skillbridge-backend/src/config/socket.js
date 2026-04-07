let _io = null;

module.exports = {
  setIO: (io) => {
    _io = io;
  },
  getIO: () => {
    if (!_io) {
      throw new Error("Socket.io not initialized!");
    }
    return _io;
  }
};
