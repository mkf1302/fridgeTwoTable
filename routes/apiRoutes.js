const 
    db = require("../models"),
    axios = require("axios")

module.exports = function(app) {

  
  //*This is the route to either add or find a User
  //!ROUTE
  app.post("/api/users", function(req, res) {

    let data = req.body
    console.log(data)

    db.User.findOrCreate( { where: { name: data.name, email: data.email } }
    
      ).then( function(result) {
      res.json(result)
    })
  })

  //*This is the route to add an Ingredient to a User's list
  //!ROUTE
  app.post("/api/add-ingredient/", function(req, res) {

    let data = req.body

    db.Ingredient.create({ label: data.label,
                           UserId: data.UserID
                          } )
                 .then( function(result) { res.json(result) } )
  })






  //*This is the route to remove an Ingredient from a User's List
  //!ROUTE
  app.delete("/api/remove-ingredient/:ingredient", function(req, res) {

    let ingredient = req.params.ingredient

    db.Ingredient.destroy({ 
                            where: { label: ingredient } 
                          } 
                          ).then( function(result) { 
                            res.json(result) 
                          })
  })






  //*This is the route to get the recipes from the api
  //!ROUTE
  app.post("/api/get-recipes/", function(req, res) {

    //Build the api query. First build the q parameter
    let data = JSON.parse(req.body.cook),
        q = "q=",
        recipeArray = [],
        userIngredients = []

    console.log("\nincoming array: ",data)


    for ( let i=0; i<data.length; i++ ) {

      if ( i < (data.length - 1) ) {
        q += data[i] + "+"
        userIngredients.push(data[i])
      } else { 
        q += data[i]
        userIngredients.push(data[i])
      } 
    }

    recipeArray.push(userIngredients)
    console.log("first stage recipeArray: ",recipeArray)

    console.log("\nq:",q)
    //At this point the q parameter is constructed. Now build the rest of the api query.

    let appID = "8417f32f",
        appKey = "cdc0b36554522a88a0242b7ea30e9837",
        query = "https://api.edamam.com/search?" + q + "&app_id=" + appID + "&app_key=" + appKey + "&from=0&to=8"

    console.log("query:",query)

    //Make the API Call
    axios.get(query)
         .then( function(response) { 

            let Recipe = response.data.hits
                

            for ( let i=0; i<Recipe.length; i++ ) {

              console.log("\n")
              console.log(Recipe[i].recipe.label)
              console.log(Recipe[i].recipe.image)
              console.log(Recipe[i].recipe.url)
              console.log(Recipe[i].recipe.ingredientLines)
              console.log(Recipe[i].recipe.calories)
              console.log(Recipe[i].recipe.yield)
              console.log(Recipe[i].recipe.totalTime)
              console.log("\n")

              let recipe = { label: Recipe[i].recipe.label,
                             image: Recipe[i].recipe.image,
                             url: Recipe[i].recipe.url,
                             ingredients: Recipe[i].recipe.ingredientLines,
                             calories: Recipe[i].recipe.calories,
                             servings: Recipe[i].recipe.yield,
                             time: Recipe[i].recipe.totalTime
                            }

              recipeArray.push(recipe)              
            }
            res.send(recipeArray)
          }).catch( function (error) { console.log(error) } )
  })






  //*This is the route to store the ingredients searched by the user.
  //!ROUTE
  app.post("/api/store-search/", function(req, res) {

    let data = JSON.parse(req.body.cook)

    console.log("data: ", data)
    console.log("userID: ",req.body.userID)

    function storeSearch(data) {
      for ( let i=0; i<data.length; i++ ) {

        db.Search.create({ label: data[i],
                           UserId: req.body.userID
                          })
      }
    }
    storeSearch(data)
  })





  //*This is the route to store a Recipe to the User's list
  //!ROUTE
  app.post("/api/store-recipe/", function(req, res) {

    
    let data = JSON.parse(req.body.save)
    console.log("data: ",data)

    function storeFavorites(data) {
      for ( let i=0; i<data.length; i++ ) {

        db.Recipe.create({ label: data[i].label,
                            image: data[i].image,
                            url: data[i].url,
                            UserId: data[i].UserID,
                            calories: data[i].calories,
                            time: data[i].time,
                            servings: data[i].servings
        }).then(function (recipe) {
          console.log("recipe return:",recipe)

          for ( let j=0; j<data[i].ingredients.length; j++ ) {

            db.recipeIngredient.create({ label: data[i].ingredients[j],
                                          RecipeId: recipe.id

            }).catch( function (error) { console.log(error) } )
          }
          
        }).catch( function (error) { console.log(error) } )
      }
    }
    storeFavorites(data)
    res.end()
  })






  //*This is the route to remove a Recipe from a User's List
  //!ROUTE
  app.delete("/api/remove-recipe/:recipeID", function(req, res) {

    let recipe = req.params.recipeID

    db.Recipe.destroy({ where: { id: recipe } } )
             .then( function(result) { res.json(result) } )
  })






  //*This is the route that grabs a recipe's saved ingredients.
  //!ROUTE
  app.post("/api/get-saved-ingredients/", function(req, res) {

    let id = req.body.id

    db.recipeIngredient.findAll( { where: { RecipeId: id } } )
                       .then( function(result) {  
                        
                        let response = []

                        console.log("result:",result)
                        for ( let i=0; i<result.length; i++ ) {

                          response.push(result[i].label)
                        }

                        res.send(response)
                       })
  })
  
}
