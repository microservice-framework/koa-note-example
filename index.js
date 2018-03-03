const Koa = require("koa");
const Router = require("koa-router");
const BodyParser = require("koa-bodyparser");
const ObjectID = require("mongodb").ObjectID;


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
  console.log(ctx.state);
  ctx.body = await ctx.app.users.find().toArray();
});

router.post("/users", async (ctx) => {
  ctx.body = await ctx.app.users.insert(ctx.request.body);
});

router.get("/users/:username", (ctx) => {
  console.log(ctx.state);
  //ctx.body = await ctx.app.users.findOne({"login":ctx.params.username});
  ctx.body = ctx.state.username;
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

router.get("/users/:username/notes", async (ctx) => {
  console.log(ctx.state);
  ctx.body = await ctx.app.notes.find({
    login: ctx.state.username.login
  }).toArray();
});

router.post("/users/:username/notes", async (ctx) => {
  ctx.request.body.login = ctx.state.username.login;
  ctx.body = await ctx.app.notes.insert(ctx.request.body);
});

router.get("/users/:username/notes/:id", async (ctx) => {
  console.log(ctx.state);
  ctx.body = await ctx.app.notes.findOne({
    "_id": ObjectID(ctx.params.id),
    login: ctx.state.username.login});
});

router.put("/users/:username/notes/:id", async (ctx) => {
  let documentQuery = {
    login: ctx.state.username.login,
    "_id": ObjectID(ctx.params.id)
  };
  let valuesToUpdate = ctx.request.body;
  ctx.body = await ctx.app.notes.updateOne(documentQuery, valuesToUpdate);
});

router.delete("/users/:username/notes/:id", async (ctx) => {
  let documentQuery = {
    login: ctx.state.username.login,
    "_id": ObjectID(ctx.params.id)
  };
  ctx.body = await ctx.app.users.deleteOne(documentQuery);
});


router.param('username', async (id, ctx, next) => {
  ctx.state.username = await ctx.app.users.findOne({"login":ctx.params.username});
  if (!ctx.state.username) return ctx.status = 404;
  return next();
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