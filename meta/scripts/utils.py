import os
from brownie import accounts, config, network


LOCAL_BLOCKCHAIN_ENVIRONMENTS = ["mainnet-fork", "matic-fork", "ganache", "development", "hardhat"]

def get_account(index=None, id=None):
    if index:
        return accounts[index]
    if network.show_active() in LOCAL_BLOCKCHAIN_ENVIRONMENTS:
        return accounts[0]
    if id:
        return accounts.load(id)
    return accounts.add(config["wallets"]["from_key"])


def get_contract():
    pass
