const HttpError = require("../models/HttpError")
const User = require("../models/user")
const Word = require("../models/words")
const SecretWord = require("../models/secretwords")
const Posts = require("../models/posts")
const BusWords = require("../models/busWords")
const config = require('../config')
const querystring = require('querystring')
const stripe = require("stripe")(config.secretKey)
const BusPosts = require("../models/busPosts")

const fs = require("fs")

const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const words = require("../models/words")




const signup = async (req, res, next) => {
    const { username, email, password } = req.body

    let existingUser

    try {
        existingUser = await User.findOne({ username: username })
    } catch (err) {
        const error = new HttpError(
            "username already in use",
            500
        )
        return next(error)
    }

    if (existingUser) {
        const error = new HttpError("this user already exists, please login", 422)
        return next(error)
    }

    let hashedPassword;

    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        const error = new HttpError(
            'Could not create user, please try again.',
            500
        );
        return next(error);
    }

    let stripeCustomerId

    try {
        stripeCustomerId = await stripe.customers.create({
            description: "Welcome!"
        })
    } catch (err) {

    }



    const createdUser = new User({
        username,
        email,
        password: hashedPassword,
        dictionarys: [],
        following: [],
        accolades: [],
        followingCurrent: [],
        followersCurrent: [],
        posts: [],
        stripeCustomerId: stripeCustomerId.id

    })

    try {
        await createdUser.save()
    } catch (err) {

        console.log(err)
        const error = new HttpError(
            "couldnt save this action",
            500
        )
        return next(error)
    }

    let token;

    try {
        token = jwt.sign(
            { userId: createdUser.id, username: createdUser.username },
            'supersecret_dont_share',
            { expiresIn: '1h' }
        );
    } catch (err) {
        const error = new HttpError(
            'Signing up failed, please try again later.',
            500
        );
        return next(error);
    }


    res.status(201).json({ userId: createdUser.id, username: createdUser.username, token: token })
}

const login = async (req, res, next) => {
    const { username, password } = req.body

    let existingUser

    try {
        existingUser = await User.findOne({ username: username })
    } catch (err) {
        const error = new HttpError(
            "login failed",
            500
        )
        return next(error)
    }

    if (!existingUser) {
        const error = new HttpError(
            "wrong information",
            401
        )
        return next(error)
    }

    let isValidPassword = false

    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (err) {
        const error = new HttpError(
            'Could not log you in, please check your credentials and try again.',
            500
        );
        return next(error);
    }

    if (!isValidPassword) {
        const error = new HttpError(
            'Invalid credentials, could not log you in.',
            403
        );
        return next(error);
    }

    let token;

    try {
        token = jwt.sign(
            { userId: existingUser.id, username: existingUser.username },
            'supersecret_dont_share',
            { expiresIn: '1h' }
        );
    } catch (err) {
        const error = new HttpError(
            'Logging in failed, please try again later.',
            500
        );
        return next(error);
    }


    res.json({
        userId: existingUser.id,
        username: existingUser.username,
        token: token
    })
}



const createDictionary = async (req, res, next) => {

    const { dictionary } = req.body

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)

    } catch (err) {

        const error = new HttpError("user isnt authenticated")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("thats not a user")
        return next(error)
    }


    const checkIfLatin = findUser.dictionarys.filter(x => x.dictionaryName.match(/\w/))


    if (checkIfLatin.length >= 1) {
        const error = new HttpError("you already have a latin dictionary")
        return next(error)
    }

    const createBook = {
        dictionaryName: dictionary,
        words: [],
        secretWords: [],
        followers: []
    }



    try {
        findUser.dictionarys.push(createBook)

    } catch (err) {
        const error = new HttpError("couldnt add dictionary to account")
        return next(error)
    }

    try {
        await findUser.save()
    } catch (err) {
        const error = new HttpError("couldnt save dictionary to database")
        return next(error)
    }

    res.json({ userDictionarys: findUser.dictionarys })




}

const createWord = async (req, res, next) => {

    const { word, definition, etymology, dictionary } = req.body


    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("ur not authenticated")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("thats not a user")
        return next(error)
    }

    console.log(findUser.dictionarys.length)

    if (findUser.dictionarys.length === 0) {
        const error = new HttpError("u dont have a dictionary")
        return next(error)
    }



    const findDictionary = findUser.dictionarys.find(x => `${x._id}` === dictionary)

    // console.log(findDictionary)

    if (!findDictionary) {
        const error = new HttpError("couldnt find dictionary by id")
        return next(error)
    }

    const createdWord = new Word({
        word: {
            definiteWord: word,
            alternatives: []
        },
        definition: [],
        date: new Date,
        etymology: etymology,
        dictionary: dictionary,
        comments: [],

    })

    const pushDef = {
        aDefinition: definition
    }


    // try {
    //     createdWord.definition.push(pushDef)
    // } catch (err) {
    //     const error = new HttpError("couldnt push definition")
    //     return next(error)
    // }

    let checkWord

    try {
        checkWord = await Word.find({ "word.definiteWord": word, dictionary: dictionary })
    } catch (err) {

        const error = new HttpError("couldnt catch that")
        return next(error)
    }



    if (checkWord.length > 0) {
        const error = new HttpError("thats already a word sorry")
        return next(error)
    }



    let findWord



    // try {
    //     findWord = await Word.findById(createdWord._id)
    // } catch (err) {
    //     const error = new HttpError("couldnt find word by id")
    //     return next(error)
    // }

    // try {
    //     findWord.definition.push(pushDef)
    // } catch (err) {
    //     const error = new HttpError("couldnt add definition")
    //     return next(error)
    // }


    try {
        await createdWord.save()
    } catch (err) {
        console.log(err)
        const error = new HttpError("couldnt save the word to our database")
        return next(error)
    }


    try {
        findWord = await Word.findById(createdWord._id)
    } catch (err) {
        const error = new HttpError("couldnt find word by id")
        return next(error)
    }

    try {
        findWord.definition.push(pushDef)
    } catch (err) {
        const error = new HttpError("couldnt add definition")
        return next(error)
    }


    try {
        await findWord.save()
    } catch (err) {
        console.log(err)
        const error = new HttpError("couldnt save the definition to our database")
        return next(error)
    }








    try {
        findDictionary.words.push(createdWord)
    } catch (err) {
        const error = new HttpError("couldnt add word to dictionary")
        return next(error)
    }

    try {
        await findUser.save()
    } catch (err) {
        const error = new HttpError("couldnt save the word to the dictionary")
        return next(error)
    }






    res.json({ dictionary: findDictionary, findWord })




}

const createSecretWord = async (req, res, next) => {

    const { theWord, theDefinition, theDictionary } = req.body

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("couldnt find user")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("thats not a user")
        return next(error)
    }

    let findSecretWord

    try {
        findSecretWord = await SecretWord.find({ word: theWord, definition: theDefinition, dictionary: theDictionary })
    } catch (err) {
        const error = new HttpError("somethings gone wrong")
        return next(error)
    }

    if (findSecretWord.length > 0) {
        const error = new HttpError("thats already a word")
        return next(error)
    }

    const createdSecretWord = new SecretWord({
        word: theWord,
        definition: theDefinition,
        dictionary: theDictionary,
        date: new Date

    })

    const findDictionary = findUser.dictionarys.find(x => `${x._id}` === theDictionary)

    try {
        createdSecretWord.save()
    } catch (err) {
        const error = new HttpError("couldnt save the secret word")
        return next(error)
    }

    try {
        findDictionary.secretWords.push(createdSecretWord)
    } catch (err) {
        const error = new HttpError("couldnt add secret word")
        return next(error)
    }

    try {
        findUser.save()
    } catch (err) {
        const error = new HttpError("couldnt save secret word to our dictionary")
        return next(error)

    }




    res.json({ createdSecretWord, secretWords: findDictionary.secretWords })

}

const findSecretWords = async (req, res, next) => {

    const aWord = req.params.secretWord
    const aDefinition = req.params.theDefinition

    let findSecretWord

    try {
        findSecretWord = await SecretWord.find({ word: aWord, })
    } catch (err) {
        const error = new HttpError("thats not a secret word")
        return next(error)
    }



    //const unique = [...new Set(findSecretWord.map(item => item.definition))]

    let findSecretDefintion

    try {
        findSecretDefintion = await SecretWord.find({ word: aWord, definition: aDefinition })
    } catch (err) {
        const error = new HttpError("couldnt find the words")
        return next(error)
    }


    res.json({ findSecretDefintion })

}

const randomWord = async (req, res, next) => {


    let findWords

    try {
        findWords = await Word.find()
    } catch (err) {
        const error = new HttpError("couldnt find any words")
        return next(error)
    }



    const aRandomWordNumber = Math.floor(Math.random() * findWords.length)

    const aRandomWord = findWords[aRandomWordNumber]



    res.json({ aRandomWord })


}

const randomSecretWord = async (req, res, next) => {

    let findSecretWords

    try {
        findSecretWords = await SecretWord.find()
    } catch (err) {
        const error = new HttpError("couldnt find random secret words")
        return next(error)
    }

    const aRandomSecretWordNumber = Math.floor(Math.random() * findSecretWords.length)

    const aRandomSecretWord = findSecretWords[aRandomSecretWordNumber]

    res.json({ aRandomSecretWord })

}



const searchAWord = async (req, res, next) => {

    const { word } = req.body

    let findWord

    try {
        findWord = await Word.find({ "word.definiteWord": word })
    } catch (err) {
        const error = new HttpError("something went wrong when searching for the word")
        return next(error)
    }

    res.json({ findWord })

}


const searchASecretWord = async (req, res, next) => {
    const { secretWord } = req.body

    let findSecretWord

    try {
        findSecretWord = await SecretWord.find({ word: secretWord })
    } catch (err) {
        const error = new HttpError("something went wrong search for that secret word")
        return next(error)
    }


    res.json({ findSecretWord })
}


const followADictionary = async (req, res, next) => {

    const { dictionary, userWithDictionary } = req.body

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong trying to find that user")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("couldnt find that user")
        return next(error)
    }

    let findUserWithDictionary

    try {
        findUserWithDictionary = await User.findById(userWithDictionary)
    } catch (err) {
        const error = new HttpError("something went wrong finding the user with the dictionary")
        return next(error)
    }

    if (!findUserWithDictionary) {
        const error = new HttpError("couldnt find the user with the dictionary")
        return next(error)
    }


    const findDictionary = findUserWithDictionary.dictionarys.find(x => `${x._id}` === `${dictionary}`)

    console.log(findDictionary)
    try {
        findDictionary.followers.push(findUser)
    } catch (err) {
        const error = new HttpError("couldnt add you to that dictionary")
        return next(error)
    }

    try {
        findUser.following.push(findDictionary)
    } catch (err) {
        const error = new HttpError("couldnt add that dictionary")
        return next(error)
    }

    try {
        await findUser.save()
    } catch (err) {
        const error = new HttpError("couldnt save this to your following dictionarys")
        return next(error)
    }

    try {
        await findUserWithDictionary.save()
    } catch (err) {
        const error = new HttpError("couldnt save to that dictionary")
        return next(error)
    }

    res.json({ findUserWithDictionary, findUser })



}

const unfollowADictionary = async (req, res, next) => {

    const dictionary = req.params.dictionary

    const userWithDictionary = req.params.userWithDictionary

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong trying to find that user")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("couldnt find that user")
        return next(error)
    }

    let findUserWithDictionary

    try {
        findUserWithDictionary = await User.findById(userWithDictionary)
    } catch (err) {
        const error = new HttpError("something went wrong finding the user with the dictionary")
        return next(error)
    }

    if (!findUserWithDictionary) {
        const error = new HttpError("couldnt find the user with the dictionary")
        return next(error)
    }


    const findDictionary = findUserWithDictionary.dictionarys.find(x => `${x._id}` === `${dictionary}`)

    try {
        findDictionary.followers.pull(findUser)
    } catch (err) {
        const error = new HttpError("couldnt unfollow you from that dictionary")
        return next(error)
    }

    try {
        findUser.following.pull(findDictionary)
    } catch (err) {
        const error = new HttpError("couldnt remove that dictionary from you")
        return next(error)
    }

    try {
        await findUserWithDictionary.save()
        await findUser.save()
    } catch (err) {
        const error = new HttpError("couldnt save that unfollow")
        return next(error)
    }

    // try {
    //     await findUser.save()
    // } catch (err) {
    //     const error = new HttpError("couldnt save ur choice")
    //     return next(error)
    // }

    res.json({ findUser, findUserWithDictionary })



}

const dictionarysNewsfeed = async (req, res, next) => {

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong finding ur id")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("couldnt find you")
        return next(error)
    }

    const mapUserDictionarys = findUser.dictionarys.map((data) => data._id)


    let findWords

    try {
        findWords = await Word.find({ dictionary: findUser.following })
    } catch (err) {
        const error = new HttpError("something went wrong finding the words")
        return next(error)
    }

    let findUserWords

    try {
        findUserWords = await Word.find({ dictionary: mapUserDictionarys })
    } catch (err) {
        const error = new HttpError("something went wrong finding ur dictionarys")
        return next(error)
    }

    const stuff = findWords.concat(findUserWords)



    let byDate = stuff.sort((a, b) => new Date(b.date) - new Date(a.date))










    // console.log(findUser.following)

    // let findUsersByDictionary

    // try {
    //     findUsersByDictionary = await User.find({ "dictionarys._id": findUser.following }, "dictionarys._id === findUser.following")
    // } catch (err) {

    //     const error = new HttpError("something went wrong looking for the dictionarys")
    //     return next(error)
    // }

    // const concatDictionarys = findUsersByDictionary.forEach(x => x.dictionary.forEach(x => x._id))



    // let findDictionaryWords

    // try {
    //     findDictionaryWords = await Word.find({})
    // } catch (err) {

    // }

    const urAdHere = {

        word: { definiteWord: "ur add here" },
        definition: [{ aDefinition: "coca cola is good" }]
    }




    if (byDate.length >= 10) {
        byDate.splice(9, 0, urAdHere)
        res.json({ byDate })
    } else {
        res.json({ byDate })
    }








}

const searchAUser = async (req, res, next) => {

    const user = req.params.username

    let findUser

    try {
        findUser = await User.find({ username: user }, "username _id dictionarys.words dictionarys.dictionaryName dictionarys.followers dictionarys._id posts")
    } catch (err) {
        const error = new HttpError("something went wrong finding that user")
        return next(error)
    }

    let findPosts

    try {
        findPosts = await Posts.find({ _id: findUser[0].posts })
    } catch (err) {
        const error = new HttpError("something went wrong getting those posts")
        return next(error)
    }

    const postsByDate = findPosts.sort((a, b) => new Date(b.date) - new Date(a.date))

    let findWords

    try {
        findWords = await Word.find({ _id: findUser[0].dictionarys[0].words })
    } catch (err) {
        const error = new HttpError("something went wrong getting those words")
        return next(error)
    }

    const wordsByDate = findWords.sort((a, b) => new Date(b.date) - new Date(a.date))


    res.json({ findUser, postsByDate, wordsByDate })

}

const clickUserProfile = async (req, res, next) => {

    const userId = req.params.userId

    let findUser

    try {
        findUser = await User.findById(userId, "-dictionarys.secretWords -secretWordDejuncture -secretWordLike")
    } catch (err) {
        const error = new HttpError("something went wrong searching for that user")
        return next(error)
    }

    res.json({ findUser })

}


const userProfile = async (req, res, next) => {



    let findUser

    try {
        findUser = await User.findById(req.userData.userId, "-password")
    } catch (err) {
        console.log(err)
        const error = new HttpError("something went wrong finding that user")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("thats not ur username")
        return next(error)
    }







    res.json({ findUser })
}


const makeAPost = async (req, res, next) => {

    const { post } = req.body

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong trying to find that user")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("ur not logged in")
        return next(error)
    }

    const createPost = new Posts({


        post: post,
        date: new Date,
        creator: req.userData.userId,
        reply: []


    })

    try {
        await createPost.save()
    } catch (err) {
        const error = new HttpError("couldnt save that splash to our database")
        return next(error)
    }


    try {
        findUser.posts.push(createPost)
    } catch (err) {
        const error = new HttpError("we cant seem to add that to ur list of splashes")
        return next(error)
    }

    try {
        await findUser.save()
    } catch (err) {
        const error = new HttpError("couldnt save that to ur splashes")
        return next(error)
    }

    res.json({ createPost, findUser })


}


const commentAPost = async (req, res, next) => {

    const { post } = req.body

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong trying to find that user")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("ur not logged in")
        return next(error)
    }

    let findPost

    try {
        findPost = await Post.findById(post)
    } catch (err) {
        const error = new HttpError("something went wrong trying to find that splash")
        return next(error)
    }

    if (!post) {
        const error = new HttpError("couldnt find that splash")
        return next(error)
    }

    const querySplashShimmers = findSplash.shimmer.find(x => `${x}` === `${findUser._id}`)

    if (querySplashShimmers) {
        const error = new HttpError("youve already shimmered that splash")
        return next(error)
    }

    try {
        findSplash.shimmer.push(findUser)
    } catch (err) {
        const error = new HttpError("couldnt add that splash")
        return next(error)
    }

    try {
        findUser.shimmer.push(findSplash)
    } catch (err) {
        const error = new HttpError("your shimmer wasnt done")
        return next(error)
    }

    try {
        await findUser.save()
        await findSplash.save()
    } catch (err) {
        const error = new HttpError("couldnt save that")
        return next(error)
    }

    res.json({ findSplash, findUser })

}




const currentAUser = async (req, res, next) => {

    const { userId } = req.body

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong looking for user")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("couldnt find ur account")
        return next(error)
    }

    let findCurrentUser

    try {
        findCurrentUser = await User.findById(userId)
    } catch (err) {
        const error = new HttpError("something went wrong looking for ur friend")
        return next(error)
    }

    if (!findCurrentUser) {
        const error = new HttpError("couldnt find ur frined")
        return next(error)
    }

    const alreadyFollowingCurrent = findUser.followingCurrent.find(x => `${x}` === `${findCurrentUser._id}`)
    const alreadyFollowerCurrent = findCurrentUser.followersCurrent.find(x => `${x}` === `${findUser._id}`)

    if (alreadyFollowerCurrent) {
        const error = new HttpError("that user is already current")
        return next(error)
    }

    if (alreadyFollowingCurrent) {
        const error = new HttpError("that already apart of ur current")
        return next(error)
    }

    try {
        findUser.followingCurrent.push(findCurrentUser)
    } catch (err) {
        const error = new HttpError("couldnt add that user to ur current")
        return next(error)
    }

    try {
        findCurrentUser.followersCurrent.push(findUser)
    } catch (err) {
        const error = new HttpError("couldnt join that users current")
        return next(error)
    }


    try {
        await findUser.save()
        await findCurrentUser.save()
    } catch (err) {
        console.log(err)
        const error = new HttpError("couldnt save that change")
        return next(error)
    }

    res.json({ findUser, findCurrentUser })

}


const uncurrentAUser = async (req, res, next) => {

    const userId = req.params.userId

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong looking for ur id")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("couldnt find ur id")
        return next(error)
    }


    let findCurrentUser

    try {
        findCurrentUser = await User.findById(userId)
    } catch (err) {
        const error = new HttpError("something went wrong looking for that user")
        return next(error)
    }

    if (!findCurrentUser) {
        const error = new HttpError("couldnt find that user")
        return next(error)
    }


    const findUserCheck = findUser.followingCurrent.find(x => `${x}` === `${findCurrentUser._id}`)
    const findCurrentUserCheck = findCurrentUser.followersCurrent.find(x => `${x}` === `${findUser._id}`)

    if (!findUserCheck) {
        const error = new HttpError("you arent current with that user")
        return next(error)
    }

    if (!findCurrentUserCheck) {
        const error = new HttpError("that user doesnt have you in their current")
        return next(error)
    }

    try {
        findUser.followingCurrent.pull(findCurrentUser)
    } catch (err) {
        const error = new HttpError("couldnt remove that user from ur current")
        return next(error)
    }

    try {
        findCurrentUser.followersCurrent.pull(findUser)
    } catch (err) {
        const error = new HttpError("couldnt pull u from that users current")
        return next(error)
    }

    try {
        await findUser.save()
        await findCurrentUser.save()
    } catch (err) {
        const error = new HttpError("couldnt save that change")
        return next(error)
    }


    res.json({ findUser, findCurrentUser })



}

const broadSearch = async (req, res, next) => {

    const { search } = req.body



    let findUser

    try {
        findUser = await User.find({ username: search }, "username && _id")
    } catch (err) {
        const error = new HttpError("something went wrong finding that user")
        return next(error)
    }

    let findWord

    try {
        findWord = await Word.find({ "word.definiteWord": search })
    } catch (err) {
        const error = new HttpError("something went wrong when searching for the word")
        return next(error)
    }

    let findDefinition

    try {
        findDefinition = await Word.find({ definition: { $elemMatch: { aDefinition: search } } })
    } catch (err) {
        const error = new HttpError("something went wrong searching for that defintion")
        return next(error)
    }

    let findDictionary

    try {
        findDictionary = await User.find({ dictionarys: { $elemMatch: { dictionaryName: search } } }, "dictionarys.dictionaryName === search dictionarys._id username")
    } catch (err) {
        const error = new HttpError("something went wrong searching for that dictionary")
        return next(error)
    }

    let findSplash

    try {
        findSplash = await Posts.find({ post: search })
    } catch (err) {
        const error = new HttpError("something went wrong searching for that splash")
        return next(error)
    }

    let findSecretWord

    try {
        findSecretWord = await SecretWord.find({ word: search })
    } catch (err) {
        const error = new HttpError("something went wrong in the search for that secret word")
        return next(error)
    }

    let findSecretWordDefinition

    try {
        findSecretWordDefinition = await SecretWord.find({ definition: search })
    } catch (err) {
        const error = new HttpError("something went wrong finding the secret word definition")
        return next(error)
    }


    // const getSearchedForDictionary = findDictionary.dictionarys.find(x => `${x.dictionaryName}` === `${search}`)





    res.json({ findUser, findWord, findDefinition, findDictionary, findSplash, findSecretWord, findSecretWordDefinition })

}

const splashFeed = async (req, res, next) => {



    let findUser

    try {
        findUser = await User.findById(req.userData.userId, "posts followingCurrent")
    } catch (err) {
        const error = new HttpError("something went wrong looking for that user")
        return next(error)
    }

    let findCurrent



    try {
        findCurrent = await User.find({ _id: findUser.followingCurrent }, "posts");
        //(findCurrent === null ? findCurrent = [] : findCurrent)
    } catch (err) {
        const error = new HttpError("something went wrong finding ur followers stuff")
        return next(error)
    }



    let findAllSplashes

    // if (findCurrent.splashes && findUser.splashes) {
    //     try {
    //         findAllSplashes = await Splash.find({ _id: findUser.splashes && findCurrent.splashes })
    //     } catch (err) {
    //         const error = new HttpError("something went wrong finding ur splash feed")
    //         return next(error)
    //     }
    // } else if (findCurrent.splashes) {
    //     try {
    //         findAllSplashes = await Splash.find({ _id: findUser.splashes })
    //     } catch (err) {
    //         const error = new HttpError("something went wrong finding ur splash feed")
    //         return next(error)
    //     }
    // } else {
    //     try {
    //         findAllSplashes = await Splash.find({ _id: findCurrent.splashes })
    //     } catch (err) {
    //         const error = new HttpError("something went wrong finding ur splash feed")
    //         return next(error)
    //     }
    // }

    const concatCurrent = findCurrent.map(x => x.posts)

    const findUserPosts = findUser.posts

    const foreachCurrent = findCurrent.map(x => x.posts)

    const queryConcat = concatCurrent.concat(findUser.posts)


    const concatArrays = [].concat.apply([], concatCurrent)

    const addUser = concatArrays.concat(findUserPosts)

    console.log(concatArrays)


    try {
        findAllSplashes = await Posts.find({ _id: addUser })
    } catch (err) {
        console.log(err)
        const error = new HttpError("something went wrong finding ur splash feed")
        return next(error)
    }








    const byDate = findAllSplashes.sort((a, b) => new Date(b.date) - new Date(a.date))





    res.json({ byDate })


}

const secretWordFeed = async (req, res, next) => {

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong finding u")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("couldnt find u")
        return next(error)
    }

    const mapUserDictionarys = findUser.dictionarys.map((data) => data._id)

    let findSecretWords

    try {
        findSecretWords = await SecretWord.find({ dictionary: mapUserDictionarys })
    } catch (err) {
        const error = new HttpError("something went wrong looking for those secret words")
        return next(error)

    }

    let byDate = findSecretWords.sort((a, b) => new Date(b.date) - new Date(a.date))

    res.json({ byDate })

}

const getDictionaryAndUser = async (req, res, next) => {

    const dictionary = req.params.dictionaryId

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong finding that users id")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("ur not logged in")
        return next(error)
    }


    let findUserAndDictionary

    try {
        findUserAndDictionary = await User.find({ "dictionarys._id": dictionary }, "dictionarys username")
    } catch (err) {

    }

    res.json({ findUserAndDictionary })

}

const dictionarySWQuery = async (req, res, next) => {

    const word = req.params.word

    const dictionary = req.params.dictionary




    let findWord

    try {
        findWord = await Word.find({ "word.definiteWord": word, dictionary: dictionary })
    } catch (err) {
        const error = new HttpError("something went wrong grabbing that word")
        return next(error)
    }

    res.json({ findWord })



}


const findPostCreator = async (req, res, next) => {

    const creator = req.params.findCreator

    let findUser

    try {
        findUser = await User.findById(creator, "dictionarys._id username")
    } catch (err) {
        const error = new HttpError("something went wrong finding that user")
        return next(error)
    }

    res.json({ findUser })

}

const heartAPost = async (req, res, next) => {


    const { postId } = req.body

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong finding that user")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("couldnt find ur account")
        return next(error)
    }

    let findPost

    try {
        findPost = await Posts.findById(postId)
    } catch (err) {
        const error = new HttpError("something went wrong looking for that post")
        return next(error)
    }

    if (!findPost) {
        const error = new HttpError("couldnt find that post")
        return next(error)
    }

    const alreadyHearted = findUser.postHearts.find(x => `${x}` === `${findPost._id}`)

    const hasAHeart = findPost.hearts.find(x => `${x}` === `${findUser._id}`)

    if (alreadyHearted) {
        const error = new HttpError("you already liked this post tho")
        return next(error)
    }

    if (hasAHeart) {
        const error = new HttpError("this post already has a heart")
        return next(error)
    }


    try {
        findUser.postHearts.push(findPost._id)
    } catch (err) {
        const error = new HttpError("that like hasnt been counted")
        return next(error)
    }

    try {
        findPost.hearts.push(findUser._id)
    } catch (err) {
        const error = new HttpError("this post didnt get liked")
        return next(error)
    }

    try {
        await findUser.save()
        await findPost.save()
    } catch (err) {
        const error = new HttpError("couldnt save that like to our database")
        return next(error)
    }

    res.json({ findUser, findPost })



}

const unheartAPost = async (req, res, next) => {

    const postId = req.params.postId

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong finding that user")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("couldnt find ur account")
        return next(error)
    }

    let findPost

    try {
        findPost = await Posts.findById(postId)
    } catch (err) {
        const error = new HttpError("something went wrong looking for that post")
        return next(error)
    }

    if (!findPost) {
        const error = new HttpError("couldnt find that post")
        return next(error)
    }

    const alreadyHearted = findUser.postHearts.find(x => `${x}` === `${findPost._id}`)

    const hasAHeart = findPost.hearts.find(x => `${x}` === `${findUser._id}`)

    if (!alreadyHearted) {
        const error = new HttpError("you havent liked that post yet")
        return next(error)
    }

    if (!hasAHeart) {
        const error = new HttpError("there is no like for this post")
        return next(error)
    }

    try {
        findUser.postHearts.pull(findPost._id)
    } catch (err) {
        const error = new HttpError("that like hasnt been counted")
        return next(error)
    }

    try {
        findPost.hearts.pull(findUser._id)
    } catch (err) {
        const error = new HttpError("this post didnt get liked")
        return next(error)
    }

    try {
        await findUser.save()
        await findPost.save()
    } catch (err) {
        const error = new HttpError("couldnt save that like to our database")
        return next(error)
    }

    res.json({ findUser, findPost })




}

const getHeartCount = async (req, res, next) => {


    const postId = req.params.postId

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("couldn't load those hearts")
        return next(error)
    }


    if (!findUser) {
        const error = new HttpError("you're not logged in")
        return next(error)
    }


    let findPosts

    try {
        findPosts = await Posts.findById(postId)
    } catch (err) {
        const error = new HttpError("couldn't load that post")
        return next(error)
    }

    res.json({ hearts: findPosts.hearts })



}

const checkIfHearted = async (req, res, next) => {

    const postId = req.params.postId

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("you're not logged in")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("you cant do that")
        return next(error)
    }


    let findPost

    try {
        findPost = await Posts.findById(postId)
    } catch (err) {
        const error = new HttpError("something went wrong finding that post")
        return next(error)
    }

    const confirmHeart = findPost.hearts.find(x => `${x}` === `${req.userData.userId}`)


    res.json({ confirmHeart })

}

const bisWord = async (req, res, next) => {

    const {
        offer,
        followersOfReceiver,
        pricePerFollowers,
        definition,
        word,
        etymology,


    } = req.body


    let verUser

    try {
        verUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong verifying you")
        return next(error)
    }

    if (!verUser) {
        const error = new HttpError("your not logged in")
        return next(error)
    }

    const newBusWord = new BusWords({
        offer: offer,
        minFollowers: [
            {
                followers: followersOfReceiver,
                price: pricePerFollowers
            }
        ],
        word: {
            definiteWord: word
        },
        definition: [
            {
                aDefinition: definition
            }
        ],
        etymology: etymology,

        definers: [],
        date: new Date,
        creator: req.userData.userId,
    })

    // const priceParams = {
    //     followers: followersOfReceiver,
    //     price: pricePerFollowers
    // }

    try {
        await newBusWord.save()
    } catch (err) {
        console.log(err)
        const error = new HttpError("something went wrong with saving that")
        return next(error)

    }

    // let findBusWord

    // try {
    //     findBusWord = await BusWords.findById(newBusWord._id)
    // } catch (err) {
    //     const error = new HttpError("something went wrong adding those price parameters")
    //     return next(error)
    // }


    // try {
    //     findBusWord.definition.push(priceParams)
    // } catch (err) {
    //     const error = new HttpError("something went wrong adding those prices")
    //     return next(error)
    // }

    // try {
    //     await findBusWord.save()
    // } catch (err) {
    //     const error = new HttpError("couldnt save those price parameters")
    //     return next(error)
    // }


    try {
        verUser.businessWords.push(newBusWord)
    } catch (err) {
        console.log(err)
        const error = new HttpError("couldnt add that to ur contracted words")
        return next(error)
    }

    try {
        await verUser.save()
    } catch (err) {
        const error = new HttpError("couldnt save that contract")
        return next(error)
    }

    res.json({ verUser, newBusWord })


}

const getBisWords = async (req, res, next) => {


    let verUser

    try {
        verUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong with ur id")
        return next(error)
    }

    if (!verUser) {
        const error = new HttpError("ur not logged in")
        return next(error)
    }


    let findBisWords

    try {
        findBisWords = await BusWords.find()
    } catch (err) {
        const error = new HttpError("something went wrong")
        return next(error)
    }


    const bisWordsByOffer = findBisWords.sort((a, b) => b.offer - a.offer)

    const bisWordsByDate = findBisWords.sort((a, b) => new Date(b.date) - new Date(a.date))

    console.log(req.session)

    res.json({ findBisWords, bisWordsByDate, bisWordsByOffer })




}

// const expressSignUp = async (req, res, next) => {



//     req.session.state = Math.random()
//         .toString(36)
//         .slice(2);

//     let parameters = {
//         client_id: config.stripe.clientId,
//         state: req.session.state,
//     };

//     parameters = Object.assign(parameters, {
//         redirect_uri: config.publicDomain

//     });

//     res.json({
//         link: config.stripe.authorizeUri + '?' + querystring.stringify(parameters)
//     }
//     );

// }

const upgradeToBusiness = async (req, res, next) => {

    const {
        country,
        email,
        bizUrl,
        bizType

    } = req.body

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong finding ur id")
        return next(error)
    }

    let account

    try {
        account = await stripe.accounts.create({
            type: 'custom',
            country: 'US',
            email: email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
                tax_reporting_us_1099_k: { requested: true }
            },
            business_profile: {
                mcc: "7399",

            },
            business_type: bizType,

            tos_acceptance: {
                date: new Date,
                ip: req.ip
            }
        });
    } catch (err) {
        const error = new HttpError("couldnt create ur stripe account")
        return next(error)
    }

    findUser.stripeBusinessId = account.id

    try {
        await findUser.save()
    } catch (err) {
        const error = new HttpError("something went wrong saving ur id")
        return next(error)
    }



    res.json({ findUser, account })

}

const updateBusinessDetails = async (req, res, next) => {

    const {
        country,
        email,
        bizUrl,
        bizType,
        firstName,
        city,
        lastName,
        state,
        address,
        zipCode,
        dobMonth,
        dobDay,
        dobYear,
        phoneNumber,
        ssn

    } = req.body

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong finding ur id")
        return next(error)
    }

    const fakeCardToken = await stripe.tokens.create({
        card: {
            number: '4000056655665556',
            exp_month: 9,
            exp_year: 2022,
            cvc: '314',
            currency: 'usd'
        },
    });

    const fakeBankToken = await stripe.tokens.create({
        bank_account: {
            country: 'US',
            currency: 'usd',
            account_holder_name: 'Gavin',
            account_holder_type: 'individual',
            routing_number: '110000000',
            account_number: '000123456789',
        },
    });

    let file1
    let file2


    const fp1 = fs.readFileSync("/Users/GavinSPotter/zgithub/dictionary/d-server/uploads/images/idback.jpg");

    var fp2 = fs.readFileSync('/Users/GavinSPotter/zgithub/dictionary/d-server/uploads/images/idfront.jpg');

    try {


        file1 = await stripe.files.create({
            purpose: 'identity_document',
            file: {
                data: fp1,
                name: 'idback.jpg',
                type: 'application/octet-stream',
            },
        });


        file2 = await stripe.files.create({
            purpose: 'identity_document',
            file: {
                data: fp2,
                name: 'idfront.jpg',
                type: 'application/octet-stream',
            },
        });
    } catch (err) {
        console.log(err)
    }



    console.log(req.ip)

    let account

    try {
        account = await stripe.accounts.update(

            findUser.stripeBusinessId,
            {
                external_account: fakeCardToken.id,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                business_profile: {
                    mcc: "7399",
                    url: bizUrl
                },
                //business_type: bizType,




                tos_acceptance: {
                    date: new Date,
                    ip: req.ip
                },
                //external_account: `${fakeCardToken.id}`,
                individual: {
                    first_name: firstName,
                    last_name: lastName,
                    address:
                    {
                        city: city,
                        state: state,
                        line1: address,
                        postal_code: zipCode,



                    },
                    dob: {
                        month: dobMonth,
                        day: dobDay,
                        year: dobYear
                    },
                    phone: phoneNumber,
                    id_number: ssn,
                    email: email,
                    // verification: {
                    //     document: {
                    //         front: file2.id,
                    //         back: file1.id
                    //     }
                    // }

                }

            }
        )
    } catch (err) {
        console.log(err)
        const error = new HttpError("couldnt update ur business data")
        return next(error)
    }

    res.json({ account })




}

const graspStripeAccount = async (req, res, next) => {


    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("youre not logged in")
        return next(error)
    }

    const account = await stripe.accounts.retrieve(
        findUser.stripeBusinessId
    );


    res.json({ account })




}

const addAPaymentMethod = async (req, res, next) => {


    const { cardNumber, cardCVC, expMonth, expYear, type } = req.body

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("sorry, you're not logged in")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("you're not logged in")
        return next(error)
    }



    let token



    try {
        token = await stripe.tokens.create({
            card: {
                number: '4242424242424242',
                exp_month: 9,
                exp_year: 2022,
                cvc: '314',
            },
        });
    } catch (err) {
        const error = new HttpError("had trouble processing your card")
        return next(error)
    }


    const customer = await stripe.customers.update(
        findUser.stripeCustomerId,
        {
            source: token.id,

        }

    );


    // const paymentMethod = await stripe.paymentMethods.create({
    //     type: type,
    //     card: {
    //         number: cardNumber,
    //         exp_month: expMonth,
    //         exp_year: expYear,
    //         cvc: cardCVC,
    //     },
    // });

    // let paymentIntent

    // try {
    //     paymentIntent = await stripe.paymentIntents.create({
    //         amount: 2001,
    //         currency: 'usd',
    //         payment_method_types: ['card'],
    //         payment_method: paymentMethod.id,
    //         customer: findUser.stripeCustomerId,
    //         confirm: true
    //     });
    // } catch (err) {
    //     const error = new HttpError("couldn't get that order")
    //     return next(error)
    // }


    // const paymentIntent = await stripe.paymentIntents.create({
    //     amount: 2001,
    //     currency: 'usd',
    //     payment_method_types: ['card'],
    //     // payment_method: paymentMethod.id,
    //     customer: findUser.stripeCustomerId,
    //     confirm: true
    // });


    // let capturePaymentIntent

    // try {
    //     capturePaymentIntent = await stripe.paymentIntents.capture(
    //         paymentIntent.id,
    //         { application_fee_amount: 100 }
    //     );
    // } catch (err) {
    //     console.log(err)
    //     const error = new HttpError("couldnt get those funds")
    //     return next(error)
    // }

    // const capturePaymentIntent = await stripe.paymentIntents.capture(
    //     paymentIntent.id,
    //     { application_fee_amount: 100 }
    // );

    // const customer = await stripe.customers.retrieve(
    //     findUser.stripeCustomerId
    // );


    // res.json({ customer })
    res.json({ customer })

















}

const chargeAnAccount = async (req, res, next) => {


    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("your not logged in")

        return next(error)
    }


    const customer = await stripe.customers.retrieve(
        findUser.stripeCustomerId
    );




    const charge = await stripe.charges.create({
        amount: 20000,
        currency: 'usd',
        customer: customer.id,
        source: customer.default_source,
        description: 'My First Test Charge (created for API docs)',

    });

    const transfer = await stripe.transfers.create({
        amount: 1000,
        currency: "usd",
        source_transaction: charge.id,
        destination: "acct_1JXdSKPb70HU1yCl",
    });

    // const chargeCapture = await stripe.charges.capture(
    //     charge.id,
    //     {
    //         transfer_group: transfer.transfer_group,
    //         application_fee_amount: 20,
    //     }
    // );



    res.json({ charge, transfer })





}


const sendAPostSponsor = async (req, res, next) => {


    const { sUser, post, exactWords, contractedPost, keyWords, keyPhrases, price } = req.body

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("you're not logged in")
        return next(error)
    }


    const userCanPay = await stripe.customers.retrieve(
        findUser.stripeCustomerId
    )

    if (!userCanPay.default_source) {
        const error = new HttpError("you haven't set up how you're going to pay")
        return next(error)
    }




    let findSUser

    try {
        findSUser = await User.find({ username: sUser })
    } catch (err) {
        const error = new HttpError("couldn't find those users")
        return next(error)
    }


    const love = []

    findSUser.map(x => { love.push({ contracted: x._id }) })



    const sponsorshipPost = new BusPosts({
        post: post,
        contractedPost: contractedPost,
        exactWords: exactWords,
        keyWords: keyWords,
        keyPhrases: keyPhrases,
        price: price,



        creator: findUser._id,
        receiver: love

    })








    try {
        await sponsorshipPost.save()
    } catch (err) {

        const error = new HttpError("couldnt save that sponsorship")
        return next(error)
    }

    try {
        findSUser.forEach(x => x.businessPosts.push(sponsorshipPost))
    } catch (err) {
        const error = new HttpError("something went wrong with that sponsorship")
        return next(error)
    }

    try {
        await findSUser.forEach(x => x.save())
    } catch (err) {
        const error = new HttpError("couldnt save that to your requested users")
        return next(error)
    }


    try {
        findUser.sponsorAPost.push(sponsorshipPost)
    } catch (err) {
        const error = new HttpError("couldn't save that to your records")
        return next(error)
    }

    try {
        findUser.save()
    } catch (err) {
        const error = new HttpError("couldnt save that")
        return next(error)
    }




















    res.json({ sponsorshipPost, findUser, findSUser })




}


const getBusPosts = async (req, res, next) => {


    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong")
        return next(error)
    }


    if (!findUser) {
        const error = new HttpError("you're not logged in")
        return next(error)
    }


    let findPSS

    try {
        findPSS = await BusPosts.find({ _id: findUser.businessPosts })
    } catch (err) {
        const error = new HttpError("something went wrong looking for your posts")
        return next(error)
    }




    res.json({ findPSS })

}


const contractPost = async (req, res, next) => {


    const { post, contractId } = req.body

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("you're not logged in")
        return next(error)
    }


    let findContract

    try {
        findContract = await BusPosts.findById(contractId)
    } catch (err) {
        const error = new HttpError("couldnt find that contract")
        return next(error)
    }


    const findReceiver = findContract.receiver.find(x => `${x.contracted}` === `${findUser._id}`)

    if (findReceiver.tookContract === true) {
        const error = new HttpError("you already took this contract")
        return next(error)
    }

    let findContractor


    try {
        findContractor = await User.findById(findContract.creator)
    } catch (err) {
        const error = new HttpError("couldn't find the user who contracted that")
        return next(error)
    }

    let stripeCustomerInfo

    try {
        stripeCustomerInfo = await stripe.customers.retrieve(
            findContractor.stripeCustomerId
        )
    } catch (err) {
        const error = new HttpError("couldnt find the contractors information")
        return next(error)
    }



    let stripeCharge

    try {
        stripeCharge = await stripe.charges.create({
            amount: findContract.price,
            currency: "usd",
            customer: stripeCustomerInfo.id,
            source: stripeCustomerInfo.default_source,
        })
    } catch (err) {
        const error = new HttpError("couldn't charge that contractor")
        return next(error)
    }

    const applicationFee = findContract.price * .90

    let stripeTransfer

    try {
        stripeTransfer = await stripe.transfers.create({
            amount: applicationFee,
            currency: "usd",
            source_transaction: stripeCharge.id,
            destination: findUser.stripeBusinessId
        })
    } catch (err) {
        console.log(err)
        const error = new HttpError("couldn't allocate you the funds")
        return next(error)
    }


    const createBusPost = new Posts({
        post: post,
        date: new Date,
        creator: req.userData.userId,
        busPost: true,
        hearts: [],
        reply: []
    })

    try {
        await createBusPost.save()
    } catch (err) {
        const error = new HttpError("that post wasn't saved")
        return next(error)
    }

    try {
        findUser.posts.push(createBusPost)
    } catch (err) {
        const error = new HttpError("had trouble with that post")
        return next(error)
    }

    try {
        await findUser.save()
    } catch (err) {
        const error = new HttpError("couldn't create that post")
        return next(error)
    }


    console.log(findUser._id)

    console.log(findReceiver)

    findReceiver.tookContract = true
    findReceiver.contractedPost = post
    findReceiver.date = new Date

    try {
        findContract.save()
    } catch (err) {
        const error = new HttpError("couldnt save the finished contract")
        return next(error)
    }



    res.json({
        findContract, createBusPost, stripeTransfer, stripeCustomerInfo
    })







}


const getAUser = async (req, res, next) => {


    const userId = req.params.userId

    let findUser

    try {
        findUser = await User.findById(req.userData.userId)
    } catch (err) {
        const error = new HttpError("something went wrong")
        return next(error)
    }

    if (!findUser) {
        const error = new HttpError("you're not logged in")
        return next(error)
    }


    let company

    try {
        company = await User.findById(userId, "username")
    } catch (err) {
        const error = new HttpError("something went wrong getting the sponsor")
        return next(error)
    }


    res.json({ company })


}


exports.checkIfHearted = checkIfHearted

exports.getHeartCount = getHeartCount

exports.getAUser = getAUser

exports.contractPost = contractPost

exports.getBusPosts = getBusPosts

exports.sendAPostSponsor = sendAPostSponsor

exports.chargeAnAccount = chargeAnAccount

exports.addAPaymentMethod = addAPaymentMethod

exports.graspStripeAccount = graspStripeAccount

exports.updateBusinessDetails = updateBusinessDetails

exports.upgradeToBusiness = upgradeToBusiness

// exports.expressSignUp = expressSignUp



exports.getBisWords = getBisWords

exports.bisWord = bisWord

exports.heartAPost = heartAPost

exports.unheartAPost = unheartAPost

exports.findPostCreator = findPostCreator


exports.dictionarySWQuery = dictionarySWQuery

exports.getDictionaryAndUser = getDictionaryAndUser


// journal : unfished:

// done

// done 

exports.splashFeed = splashFeed

exports.secretWordFeed = secretWordFeed

//

// add splash and secret word

exports.broadSearch = broadSearch

//
exports.clickUserProfile = clickUserProfile
exports.uncurrentAUser = uncurrentAUser
exports.currentAUser = currentAUser

// done

exports.makeAPost = makeAPost

//
exports.userProfile = userProfile

// deprecated

exports.searchAUser = searchAUser

//

// dictionary stuff : unfinished

exports.dictionarysNewsfeed = dictionarysNewsfeed
exports.unfollowADictionary = unfollowADictionary
exports.followADictionary = followADictionary
exports.searchASecretWord = searchASecretWord
exports.searchAWord = searchAWord

exports.randomSecretWord = randomSecretWord
exports.randomWord = randomWord
exports.findSecretWords = findSecretWords
exports.createSecretWord = createSecretWord
exports.createWord = createWord
exports.createDictionary = createDictionary

// login && signup : done

exports.login = login;
exports.signup = signup