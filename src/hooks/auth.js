const validateToken = () => {
  return new Promise((resolve, reject) => {
    // token check logic
    resolve({ userId: "123" });
  });
};
export const authHandler = (request, reply, done) => {
  console.log("checking auth....");
  validateToken()
    .then((user) => {
      request.userId = user.userId;
      done();
    })
    .catch((err) => {
      done(err);
    });
};
