from brownie import MetaTreasury, StageTokenContract, config, network
from scripts.utils import get_account, get_contract
from web3 import Web3
import json
import os


INITIAL_SUPPLY = 1000000000000


def stage_token_deploy(account=None):
    if account is None:
        account = get_account()
    stage_token = StageTokenContract.deploy(INITIAL_SUPPLY, {"from": account})
    return stage_token


def meta_treasury_deploy():
    account =  get_account()
    stage_token = stage_token_deploy(account=account)
    meta_treasury = MetaTreasury.deploy(
        stage_token.address, 
        {"from": account}, 
        publish_source=config["networks"][network.show_active()]["verify"]
    )
    tx = stage_token.transfer(
        meta_treasury.address, stage_token.totalSupply(), {"from": account}
    )
    tx.wait(1)
    return meta_treasury


def request_creator_funds(creator_wallet, amount):
    meta_treasury = get_contract()  # get the most recent deployed meta treasury
    meta_treasury.requestFunds(amount, {"from": creator_wallet})
    # do we need something else here? 


def deposit_user_funds(user_wallet, amount):
    meta_treasury = get_contract()  # get the most recent deployed meta treasury
    meta_treasury.depositFunds(amount, {"from": user_wallet})
    # do we need somethng else here?


def voting_projects_protocol(user_wallet, creator_wallet):
    meta_treasury = get_contract()  # get the most recent deployed meta treasury
    meta_treasury.getVoteFunding(creator_wallet, {"from": user_wallet})
    # do we need something else here?
