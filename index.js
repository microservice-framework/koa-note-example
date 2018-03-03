const Koa = require("koa");
const Router = require("koa-router");
const BodyParser = require("koa-bodyparser");


const app = new Koa();
require("./includes/mongo")(app);
const jwt = require("./includes/jwt");
const router = new Router();
const routerNotSecure = new Router();

app.use(BodyParser());

router.use(jwt.errorHandler()).use(jwt.jwt());

router.get("/", function (ctx) {
    ctx.body = {message: "Hello World!"}
});

router.get("/users", async (ctx) => {
  ctx.body = await ctx.app.users.find().toArray();
});

router.post("/users", async (ctx) => {
  ctx.body = await ctx.app.users.insert(ctx.request.body);
});

router.get("/users/:username", async (ctx) => {
  ctx.body = await ctx.app.users.findOne({"login":ctx.params.username});
});

router.put("/users/:username", async (ctx) => {
  let documentQuery = {"login": ctx.params.username};
  let valuesToUpdate = ctx.request.body;
  ctx.body = await ctx.app.users.updateOne(documentQuery, valuesToUpdate);
});

router.delete("/users/:username", async (ctx) => {
  let documentQuery = {"login": ctx.params.username};
  ctx.body = await ctx.app.users.deleteOne(documentQuery);
});

routerNotSecure.post("/login", async (ctx) => {
  let username = ctx.request.body.username;
  let password = ctx.request.body.password;

  let user = await ctx.app.users.findOne({
    login: ctx.request.body.username,
    password: ctx.request.body.password
  });
  console.log(user);

  if (user) {
      ctx.body = {
          token: jwt.issue({
              username: user.login,
              role: user.role
          })
      }
  } else {
      ctx.status = 401;
      ctx.body = {error: "Invalid login"}
      console.log('failed');
  }
});

app.use(router.routes()).use(router.allowedMethods());
app.use(routerNotSecure.routes()).use(routerNotSecure.allowedMethods());

app.listen(3000);