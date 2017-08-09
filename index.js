const supportPostMessage = 'postMessage' in window;
/**
 * 构建消息体
 * @class Message
 */
class Messager{
    constructor(target,name,prefix){
        this.target = target;
        this.name = name;
        this.prefix = prefix;
    }
    send(msg , handlerId){
        const id = this.prefix + ':' + this.name;

        if(typeof msg === 'string'){
            msg = {
                id:'*',
                body:msg
            }
        }

        msg = `${id}__Messenger__${JSON.stringify(msg)}`;
        
        if ( supportPostMessage ){
            this.target.postMessage(msg, handlerId || '*');
        } else {
            let targetFunc = window.navigator[id];
            if ( typeof targetFunc == 'function' ) {
                targetFunc(msg, window);
            } else {
                throw new Error("target callback function is not defined");
            }
        }
    }
}


class Connect{
    constructor(name , prefix , whiteList){
        this.prefix = prefix;
        this.targets = {};
        this._handlers = {};
        this.whiteList = whiteList || [];

        let _id = `${prefix}:${name}`;

        const emitter = (event) => {
            if (this.whiteList.length && !~this.whiteList.indexOf(event.origin)) return console.log('不在白名单');
            let {data} = event;
            let [ id , msg] = data.split('__Messenger__');
            let [prefix,name] = id.split(':');
            let _msg = JSON.parse(msg);
            if(_id !== id){
                return console.log('校验失败！')
            }
            
            try {
                this._handlers[_msg.id](_msg.body);
            } catch (error) {
                console.log(error);
            }   
        }

        if ( supportPostMessage ){
            if ( 'addEventListener' in document ) {
                window.addEventListener('message', emitter, false);
            } else if ( 'attachEvent' in document ) {
                window.attachEvent('onmessage', emitter);
            }
        } else {
            // 兼容IE 6/7
            window.navigator[_id] = emitter;
        }
    }
    
    send(target, msg){
        this.targets[target] && this.targets[target].send(msg);
    }

    register(name , target ){
        this.targets[name] = new Messager(target , name , this.prefix);
        return this;
    } 
    on(key , func){
        if(arguments.length<2){
            key = '*';
            func = arguments[0];
        }
        this._handlers[key] = func;
    }
}

window.createConnect = (name , prefix , whiteList)=>{
    return new Connect(name , prefix , whiteList);
};