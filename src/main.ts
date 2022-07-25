import * as Trader from "./trader";
import * as Market from "./market";
import file from "./file";
import test from "./test";

async function main() {
    console.log("trader main initialized successfully!");
    try {
        let marketConfig: any = await new file("/home/josh/trader/etc/tdameritrade/config.json").get();
        marketConfig = JSON.parse(marketConfig);
        await test(Market.tests(marketConfig));
    } catch( error ) {
        console.log( error );
    }
}

main().catch(function( error ) {
    console.log(error);
});