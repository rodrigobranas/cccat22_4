import crypto from "crypto";
import { validateCpf } from "../../domain/validateCpf";
import { validatePassword } from "../../domain/validatePassword";
import { validateEmail } from "../../domain/validateEmail";
import { validateName } from "../../domain/validateName";
import { inject } from "../../infra/di/Registry";
import AccountAssetDAO from "../../infra/dao/AccountAssetDAO";
import AccountDAO from "../../infra/dao/AccountDAO";

export default class AccountService {
    @inject("accountDAO")
    accountDAO!: AccountDAO;
    @inject("accountAssetDAO")
    accountAssetDAO!: AccountAssetDAO;

    async signup (account: any) {
        account.accountId = crypto.randomUUID();
        if (!validateName(account.name)) throw new Error("Invalid name");
        if (!validateEmail(account.email)) throw new Error("Invalid email");
        if (!validateCpf(account.document)) throw new Error("Invalid document");
        if (!validatePassword(account.password)) throw new Error("Invalid password");
        await this.accountDAO.save(account);
        return {
            accountId: account.accountId
        };
    }

    async getAccount (accountId: string) {
        const account = await this.accountDAO.getById(accountId);
        if (!account) throw new Error("Account not found");
        account.balances = await this.accountAssetDAO.getByAccountId(accountId);
        return account;
    }

    async deposit (accountAsset: any) {
        const account = await this.accountDAO.getById(accountAsset.accountId);
        if (!account) throw new Error("Account not found");
        await this.accountAssetDAO.save(accountAsset);
    }

    async withdraw (accountAsset: any) {
        const account = await this.getAccount(accountAsset.accountId);
        const balance = account.balances.find((balance: any) => balance.asset_id === accountAsset.assetId);
        const quantity = parseFloat(balance.quantity) - accountAsset.quantity;
        if (quantity < 0) throw new Error("Insuficient funds");
        await this.accountAssetDAO.update({ accountId: accountAsset.accountId, assetId: accountAsset.assetId, quantity });
    }
}
