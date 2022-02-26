const fowarderOrigin = 'http://localhost:9010';



const initialize = () => {
    // Basic Actions section
    // Click button to connect metamask wallet
    const onBoardButton = document.getElementById('connectButton');
    const getAccountsButton = document.getElementById('getAccounts');
    const getAccountsResult = document.getElementById('getAccountsResult');

    // Create a check function to see if metamask is connect
    const isMetaMaskInstalled = () => {
        // Have to check the ethereum binding on the window to see if it's installed
        const { ethereum } = window;
        return Boolean(ethereum && ethereum.isMetaMask);
    };

    // Create a new onboarding object to use in our app, we need to have @metamask/onboarding' library installed
    // Check out 'https://github.com/MetaMask/metamask-onboarding#metamask-onboarding' for more details on how to use the onboarding API
    const onboarding = new MetaMaskOnBoarding({ fowarderOrigin });

    // This starts the onboarding process
    const onClickInstall = () => {
        onBoardButton.innerText = 'Onboarding in process';
        onBoardButton.disabled = true;
        // On this object we have the startOnBoarding method that will start the on board process for the end user
        onboarding.startOnBoarding();
    };

    const onClickConnect = async () => {
        try {
            // Open the MetaMask UI
            // You should always disable the button while the request is pending!
            await ethereum.request({ method: 'eth_requestAccounts' });
        } catch (error) {
            console.error(error);
        }
    };

    const MetaMaskClientCheck = () => {
        // We check if metamask is installed
        if (!isMetaMaskInstalled()) {
            // if it is not installed we ask the user to install it
            onBoardButton.innerText = 'Click here to install MetaMask';
            // When the button is clicked we call onClickInstall function
            onBoardButton.onclick = onClickInstall;
            // Then we disable the button
            onBoardButton.disabled = false;
        } else {
            // If it is installed we change inner text to 'Connect'
            onBoardButton.innerText = 'Connect'
            // When the button is clicked we call onClickConnect function
            onBoardButton.onclick = onClickConnect;
            // The button is now disabled
            onBoardButton.disabled = false;
        }
    };
    MetaMaskClientCheck();

    // Eth_Accounts-getAccountsButton
    getAccountsButton.addEventListener('click', async () => {
        // we use eth_accounts because it returns a list of addresses owned by us.
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        // We take the first address in the array of addresses and display it
        getAccountResult.innerHTML = accounts[0] || 'Not able to get accounts'; 
    })
}
window.addEventListener('DOMContentLoaded', initialize);