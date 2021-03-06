import uid from "uid-safe";

export class Store {
    constructor() {
        this.session = {};
    }

    decode(string) {
        if(!string) return "";

        let session = "";

        try{
            session = new Buffer(string, "base64").toString();
        } catch(e) {}

        return JSON.parse(session);
    }

    encode(obj) {
        return new Buffer(obj).toString("base64");
    }

    getID(length) {
        return uid.sync(length);
    }

    async get(sid) {
        return this.decode(this.session[sid]);
    }

    async set(session, opts) {
        opts = opts || {};
        if(!opts.sid) {
            opts.sid = this.getID(24);
        }

        this.session[opts.sid] = this.encode(JSON.stringify(session));

        return opts.sid;
    }

    async destory(sid) {
        delete this.session[sid];
    }
}


export default function(opts = {}) {
    opts.key = opts.key || "koa:sess";
    opts.store = opts.store || new Store();

    return async function(ctx, next) {
        let id = ctx.cookies.get(opts.key, opts);

        if(!id) {
            ctx.session = {};
        } else {
            ctx.session = await opts.store.get(id);
            ctx.session = typeof ctx.session === 'string' ? {} : ctx.session;
        }

        await next();

        if(ctx.session == null) {
            await opts.store.destory(id);
        } else {
            let sid = await opts.store.set(ctx.session, Object.assign(opts, {sid: id}));

            if(sid != id) ctx.cookies.set(opts.key, sid, opts);
        }

    }
}
