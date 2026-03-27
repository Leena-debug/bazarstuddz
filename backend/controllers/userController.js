exports.login = (req, res) => {
  const { email, password } = req.body;

  console.log("LOGIN:", email, password);

  res.json({
    message: "Login received successfully",
    email: email
  });
};

exports.register = (req, res) => {
  const { email, password } = req.body;

  console.log("REGISTER:", email, password);

  res.json({
    message: "Register received successfully",
    email: email
  });
};