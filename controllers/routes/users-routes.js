const express = require("express")

const usersController = require("../controllers/user-controller")


const checkAuth = require('../middleware/check-auth');

const router = express.Router()

router.get("/clickUserProfile/:userId", usersController.clickUserProfile)

router.get("/randomWord", usersController.randomWord)

router.get("/randomSecretWord", usersController.randomSecretWord)

router.get("/searchAUser/:username", usersController.searchAUser)



router.get("/findPostCreator/:findCreator", usersController.findPostCreator)

router.get("/dictionarySWQuery/:word/:dictionary", usersController.dictionarySWQuery)



router.post("/signup", usersController.signup)

router.post("/login", usersController.login)

router.post("/searchAWord", usersController.searchAWord)

router.post("/searchASecretWord", usersController.searchASecretWord)




router.use(checkAuth);



// router.get("/expressSignup", usersController.expressSignUp)

router.get("/getDictionaryAndUser/:dictionaryId", usersController.getDictionaryAndUser)

router.get("/getHeartCount/:postId", usersController.getHeartCount)

router.get("/checkIfHearted/:postId", usersController.checkIfHearted)

router.get("/getAUser/:userId", usersController.getAUser)

router.get("/findSSPosts", usersController.getBusPosts)

router.get("/retrieveStripeAcct", usersController.graspStripeAccount)

router.get("/secretWordFeed", usersController.secretWordFeed)

router.get("/splashFeed", usersController.splashFeed)

router.get("/userProfile", usersController.userProfile)

router.get("/getBisWords", usersController.getBisWords)

router.get("/getPostsYouSponsor", usersController.getPostsYouSponsor)


router.post("/aSearch", usersController.broadSearch)

router.post("/currentAUser", usersController.currentAUser)

router.post("/contractAPost", usersController.contractPost)

router.post("/upgradeToBusiness", usersController.upgradeToBusiness)

router.post("/updateBizDetails", usersController.updateBusinessDetails)

router.post("/chargeAnAccount", usersController.chargeAnAccount)

router.post("/addAPaymentMethod", usersController.addAPaymentMethod)

router.post("/makeAPost", usersController.makeAPost)

router.post("/sendAPostSponsorship", usersController.sendAPostSponsor)

router.get("/dictionaryFeed", usersController.dictionarysNewsfeed)

router.post("/followADictionary", usersController.followADictionary)

router.post("/bisWord", usersController.bisWord)

router.post("/heartAPost", usersController.heartAPost)



router.post("/createDictionary", usersController.createDictionary)

router.post("/createWord", usersController.createWord)

router.post("/createSecretWord", usersController.createSecretWord)

router.delete("/unheartAPost/:postId", usersController.unheartAPost)

router.delete("/uncurrentAUser/:userId", usersController.uncurrentAUser)

router.delete("/unfollow/:dictionary/:userWithDictionary", usersController.unfollowADictionary)



module.exports = router

