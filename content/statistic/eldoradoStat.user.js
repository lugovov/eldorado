// ==UserScript==
// @name         Eldorado stat
// @namespace    https://eldorado.botva.ru/
// @version      0.1.1
// @description  Сборщик статистистики
// @author       Lugovov
// @match        https://eldorado.botva.ru/
// @downloadURL  https://github.com/lugovov/eldorado/raw/master/content/statictic/eldoradoStat.user.js
// @grant       GM_getValue
// @grant       GM_setValue
// @run-at      document-load
// ==/UserScript==

(function() {
    'use strict';
    var win=window.unsafeWindow||window,
        update=false,
        updateDate=false;
    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    let uuid;
    try{
        uuid=decodeURI(GM_getValue('uuid'));
        if(uuid=='undefined') throw undefiend;
    }catch(e){
        uuid=uuidv4();
        GM_setValue('uuid',encodeURI(uuid));
    }
    win.jQuery(document).ajaxComplete( function( event, xhr, options ){
        if(options.url=='https://eldorado.botva.ru/fx.php'){
            update=true;
            updateDate=Date.now();
           // win.ng_data.info._event_badman.active_to=Math.ceil(Date.now()/1000)+3*3600;
            try{
                var params=new URLSearchParams(options.data);
                switch(params.get('cmd')){
                    case 'market_buy':{
                        let res=params.get('res');
                        // Код ресурса
                        break;
                    }
                    case 'get_rating':{
                        sendRating(xhr.responseJSON.result);
                        break;
                    }
                }
            }catch(e){
                console.error(e);
            }
        }
    })
    var countRes=function(){
        let res=[
            Number(win.ng_data.info.res_1),
            Number(win.ng_data.info.res_2),
            Number(win.ng_data.info.res_3),
            Number(win.ng_data.info.res_4)
        ];
        for(let i in win.ng_data.info._hero_list){
            let her= win.ng_data.info._hero_list[i];
            res[0]+=Number(her.res_1);
            res[1]+=Number(her.res_2);
            res[2]+=Number(her.res_3);
            res[3]+=Number(her.res_4);
        }
        return res;
    }
    var countUnits=function(){
        let units=[
            Number(win.ng_data.info.unit_1),
            Number(win.ng_data.info.unit_2),
            Number(win.ng_data.info.unit_3),
        ];
        for(let i in win.ng_data.info._hero_list){
            let her= win.ng_data.info._hero_list[i];
            units[0]+=Number(her.unit_1);
            units[1]+=Number(her.unit_2);
            units[2]+=Number(her.unit_3);
        }
        if(win.ng_data.info._pvp_data){
            for(let i in win.ng_data.info._pvp_data.events_my){
                let her= win.ng_data.info._pvp_data.events_my[i];
                units[0]+=Number(her.unit_1);
                units[1]+=Number(her.unit_2);
                units[2]+=Number(her.unit_3);
            }
        }
        return units;
    }
    var countCards=function(){
        let count=[0,0,0,0]
        for(let c in win.ng_data.info._cards){
            count[win.ng_data.info._cards[c].rank-1]++
        }
        return count;
    }
    var getRating=function(){
        let pos;
        for(let i in win.ng_data.server.rating_list){
            if(win.ng_data.server.rating_list[i].id==win.ng_data.info.id) pos=win.ng_data.server.rating_list[i].pos
        }
        return pos;
    }
    var sendRating=function(data){
            let f=new FormData();
            f.append('data',JSON.stringify(data));
            fetch('https://lugovov.ru/eldoradorating.php',{
                method:'POST',
                mode: 'no-cors',
                credentials: 'omit',
                body:f
            })
    }
    var sendStat=function(){
        if(update){
            let stat={
                id : win.ng_data.info.id,
                uuid : uuid,
                cards : countCards(),
                gems : win.ng_data.info.gems,
                gold : win.ng_data.info.gold,
                res : countRes(),
                units : countUnits(),
                glory : win.ng_data.info.glory,
                timestamp : updateDate,
                rating : getRating(),
                orders : win.ng_data.info._castle_data[9].data.orders,
                //keep:win.ng_data.info._castle_data.units_keep,
                //units_free:[win.ng_data.info.unit_1,win.ng_data.info.unit_2,win.ng_data.info.unit_3]
                pvp : win.ng_data.info._pvp_data,
            }
            console.log(stat);
            let f=new FormData();
            f.append('stat',JSON.stringify(stat));
            fetch('https://lugovov.ru/eldoradostat.php',{
                method:'POST',
                mode: 'no-cors',
                credentials: 'omit',
                body:f
            }).then(()=>{
                update=false;
            })
        }
    }
    setInterval(sendStat,300000);
})();