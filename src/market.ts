import fetch from "isomorphic-fetch"

function escapeRegExp( input: string ) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function entries( object: any ) {
    let keys = Object.keys( object );
    let entries = keys.map(function( key ) {
        return {
            key: key,
            value: object[key]
        };
    });
    return entries;
}

function replace( target: string, source: any ) {
    let final = entries( source ).reduce(function( final, entry ) {
        let pattern = new RegExp(escapeRegExp( "{{" + entry.key + "}}" ), "g");
        final = final.replace( pattern, entry.value );
        return final;
    }, target);
    return final;
}

function createQueryString( parameters: any ) {
    let queryString: string = entries( parameters )
    .reduce(function( final: string, entry: any ) {
        final += entry.key + "=" + encodeURIComponent( entry.value ) + "&"; 
        return final;
    }, "?").replace(/&$/, "");
    return queryString;
}

interface MarketConfig {
    refreshToken: string;
    clientId: string;
    redirectUri: string;
    accountId: string;
    authToken?: string;
}

export default class Market {
    public quoteUrl: string = "https://api.tdameritrade.com/v1/marketdata/{{symbol}}/quotes?apikey={{clientId}}";
    public tradeUrl: string = "https://api.tdameritrade.com/v1/accounts/{{accountId}}/orders";
    public accountUrl: string = "https://api.tdameritrade.com/v1/accounts/{{accountId}}";
    
    constructor( public config: MarketConfig ) {}

    public async authenticate(): Promise<void> {
        let self = this;
        let response: any = await fetch("https://api.tdameritrade.com/v1/oauth2/token", {
            "headers": new Headers({
                "accept": "*/*",
                "accept-encoding": "gzip",
                "content-type": "application/x-www-form-urlencoded",
            }),
            "body": createQueryString({
                grant_type: "refresh_token",
                refresh_token: self.config.refreshToken,
                redirect_uri: self.config.redirectUri,
                client_id: self.config.clientId + "@AMER.OAUTHAP",
                code: "",
                access_type: ""
            }).replace(/^\?/, ""),
            "method": "POST",
        }).then( response => (response.status == 200 )? response.json(): response );
        
        if ( response.access_token == undefined ) {
            throw new Error("There was an error while trying to fetch the access token.");
        } else {
            self.config.authToken = response.access_token;
        }
    }
    
    public async getQuote( symbol: string ) {
        let self = this;
        let quoteUrl = replace(self.quoteUrl, {
            symbol: symbol,
            clientId: self.config.clientId
        });
        let response = await fetch( quoteUrl, {
            headers: new Headers({
                "Authorization": "Bearer " + self.config.authToken
            })
        });
        if ( response.status == 200 ) {
            let json = await response.json();
            let quote = json[symbol];
            return quote;
        } else {
            throw new Error("Failed to return quote.");
        }
    }
    public async buy( symbol: string, quantity: number ) {
        let self = this;
        let tradeUrl = replace(self.tradeUrl, {
            accountId: self.config.accountId
        });
        let response = await fetch( tradeUrl, {
            headers: new Headers({
                "Authorization": "Bearer " + self.config.authToken,
                "Content-Type": "application/json"
            }),
            method: "POST",
            body: JSON.stringify({
                "orderType": "MARKET",
                "session": "NORMAL",
                "duration": "DAY",
                "orderStrategyType": "SINGLE",
                "orderLegCollection": [{
                    "instruction": "Buy",
                    "quantity": quantity,
                    "instrument": {
                        "symbol": symbol,
                        "assetType": "EQUITY"
                    }
                }]
            })
        });
        if ( response.status == 201 ) {
            return true;
        } else {
            throw new Error( response.status + ": " + await response.text() );
        }
    }

    public async sell( symbol: string, quantity: number ) {
        let self = this;
        let tradeUrl = replace(self.tradeUrl, {
            accountId: self.config.accountId
        });
        let response = await fetch( tradeUrl, {
            headers: new Headers({
                "Authorization": "Bearer " + self.config.authToken,
                "Content-Type": "application/json"
            }),
            method: "POST",
            body: JSON.stringify({
                "orderType": "MARKET",
                "session": "NORMAL",
                "duration": "DAY",
                "orderStrategyType": "SINGLE",
                "orderLegCollection": [{
                    "instruction": "Sell",
                    "quantity": quantity,
                    "instrument": {
                        "symbol": symbol,
                        "assetType": "EQUITY"
                    }
                }]
            })
        });
        if ( response.status == 201 ) {
            return true;
        } else {
            throw new Error( response.status + ": " + await response.text() );
        }
    }

    public async getAccount() {
        let self = this;
        let accountUrl = replace( self.accountUrl, {
            accountId: self.config.accountId
        }) + createQueryString({
            fields: "positions"
        });
        let response: any = await fetch(accountUrl, {
            headers: new Headers({
                "Authorization": "Bearer " + self.config.authToken
            }),
        });
        if( response.status == 200 ) {
            let json = await response.json();
            return json;
        } else {
            throw new Error( response.status + ": " + await response.json() );
        }
    }
}

export function tests( marketConfig: MarketConfig ) {
    return [{
        name: "Market.getQuote_AAPL_returnsQuote",
        context: async function() {
            let market = new Market( marketConfig );
            await market.authenticate();
            return market;
        },
        input: ["AAPL"],
        function: async function( ticker: string ) {
            let market = this;
            let quote = await market.getQuote( ticker );
            return quote.symbol == ticker;
        },
        output: true,
        debug: true
    }];    
}