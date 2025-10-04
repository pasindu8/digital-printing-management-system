module.exports = (err, req, res, next) => {
  console.error(err);
  const status = err.status || 400;
  res.status(status).json({ error: err.message || 'Error' });
};