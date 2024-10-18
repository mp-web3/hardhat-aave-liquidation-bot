require("dotenv").config()

// This script will update the constans folder inside nextjs-smartcontract-lottery
// in order to have everything we need in our frontend to interact with the deployed contracts
// It will update frontend only when the variable in env file `UPDATE_FRONTED=true`
module.exports = async function () {
    if (process.env.UPDATE_FRONTEND) {
        console.log("Updating frontend...")
    }
}
