

const express = require("express");
const bodyParser = require("body-parser");
const request= require("request");
var mongoose = require("mongoose");
var k;
const app =express();
var erBase = require("eventregistry");
var er = new erBase.EventRegistry();
var path = require("path");
const ContentBasedRecommender = require('content-based-recommender');



var urlencodedParser=bodyParser.urlencoded({extended:false});

let SummarizerManager = require("node-summarizer").SummarizerManager;
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect("mongodb://localhost:27017/mydb",{ useNewUrlParser: true, useUnifiedTopology: true})
.then (()=>console.log("Connection Successful"))
.catch((err) => console.log(err));
const newarticlesSchema = new mongoose.Schema({
    uri: String,
    lang: String,
    isDuplicate: String,
    date: String,
    time: String,
    dateTime: Date,
    url: String,
    title: String,
    source:{ 
		uri: String,
        dataType: String,
        title: String
    },
    authors: [
	{}
	],
    image: String,
    eventUri: String,
    sentiment: String,
	summary: String,
	category: []
});

const usersSchema = mongoose.model('User', {
    name: String,
    email: String,
    bookmark:[{type: Object, unique: true } ]
});


const Newarticle = new mongoose.model("Newarticle", newarticlesSchema);
let updatesAfterTm;

const createDocument = async () => {
   

	var er = new erBase.EventRegistry({apiKey: "6f892bf9-de4a-45d6-b253-7bdaefde640a"});
	
	const query = new erBase.QueryArticles({
        categoryUri: await er.getCategoryUri("business"),
        isDuplicateFilter: "skipDuplicates",
        lang: "eng",
        startSourceRankPercentile: 0,
        endSourceRankPercentile: 30,
        //returnInfo: new erBase.ReturnInfo({articleInfo: new erBase.ArticleInfoFlags({categories: true})}),
    });
    //const query = new erBase.QueryArticles(er);
    const articleInfo = new erBase.ArticleInfoFlags({categories: true});
    const returnInfo = new erBase.ReturnInfo({articleInfo});
    //const requestArticleInfo = new erBase.RequestArticleInfo({returnInfo:returnInfo});
    query.setRequestedResult(
        new erBase.RequestArticlesRecentActivity({
            maxArticleCount: 5,
            returnInfo,
            // consider articles that were published at most 10 minutes ago
            updatesAfterTm,
        })
    );
    const articleList = await er.execQuery(query);
	console.log(articleList.recentActivityArticles.activity)
    // TODO: do here whatever you need to with the articleList
    for (const article of articleList.recentActivityArticles.activity) {
		//console.log(article);
		var art = article;
		var body=art.body;
		let Summary = await summ(body);
		var category =await catego(art.categories);
		var a=art;
				var b={
				 uri:a.uri,
				 lang:a.lang,
				 isDuplicate: JSON.stringify(a.isDuplicate),
				 date: a.date,
				 time: a.time,
				 dateTime: a.dateTime,
				 //dateTimePub:a.dateTimePub,
				 //dataType: a.dataType,
				 //sim: JSON.stringify(a.sim),
				 url: a.url,
				 title:a.title,
				 //body: a.body,
 
				 source:{ 
					 uri: a.source.uri,
					 dataType: a.source.dataType,
					 title: a.source.title
				 },
				 authors: [
				 {}
				 ],
				 image: a.image,
				 eventUri:a.eventUri,
				 sentiment: JSON.stringify(a.sentiment),
				 //wgt: JSON.stringify(a.wgt),
				 //relevance: a.relevance,
				 summary:Summary,
				 category: category
				}
				console.log(b);
				//console.log(Summary);
				if (Summary=="Error: Not Enough similarities to be summarized, or the sentence is invalid.")
				{
					console.log("Error in summary.");
				}
				else
				{
					const arti = new Newarticle(b);
					//console.log("Yes");
					arti.save();
					//console.log(result);
				}
        //console.log(article);
    }
    // wait exactly a minute until next batch of new content is ready
    await erBase.sleep(60 * 1000);
    updatesAfterTm = articleList.recentActivityArticles.currTime;
    createDocument();
		
}


// createDocument();

var category  = [];
const catego = (e)=>{
	return new Promise((resolve, reject)=>{
		//console.log(e);
		 var c=0;
			category = [];
				var cat = e;
				var categ = new Set();
				//console.log(cat);
				for(var j=0;j<cat.length;j++)
				{
		//			console.log(cat[j].uri.slice(0,14));
				if( cat[j].uri.slice(0,14)=="dmoz/Business/")
					{
						//console.log(cat[j].uri.slice(0,14));   
					let o = 15;
						c=0;
						//console.log(cat[j].uri[o])
					while(cat[j].uri[o]!='/' && o<cat[j].uri.length)
						{ 
							//console.log(cat[j].uri[o]);
							c++;
						o++;
						}
					//	console.log(cat[j].uri.slice(14,15+c));
					
						categ.add(cat[j].uri.slice(14,15+c));
					}
			}
			categ.forEach(x=>category.push(x));
			
			resolve(category);
			
	});
}; 


			const summ = (e)=>{
				return new Promise((resolve, reject)=>{
					e=e.replace( /[\r\n]+/gm, "" );
					e = e.replace(/"([^"]+(?="))"/g, '$1');
					let Summarizer = new SummarizerManager(e,3); 
					let summary =  Summarizer.getSummaryByRank().then((summary_object)=>{
						resolve(summary_object.summary);
					});
				});
			}; 

			const up=(f, summa)=>{
				var myquery = { _id: `${f}` };
							var newvalues = { $set: {summary: `${summa}`} };
							Newarticle.updateMany(myquery, newvalues, function(err, res) {
								if (err) throw err;
								else
								console.log("1 document updated");
								//db.close();
							  });
			};
			


app.get("/home/bookmark",function(request,response){
	console.log("running");

	usersSchema.find({},function(err,Items){
		if(err)
			console.log(err);
		Newarticle.find({"uri": Items[0].bookmark }).sort({dateTime:'desc'}).exec(function(err,foundItems){
			if(err)
			  console.log(err);
			response.render("bookmark",{listitem: foundItems});
		  }); 
	});

});


const recommender = new ContentBasedRecommender({
	minScore: 0.1,
	maxSimilarDocuments: 100
  });

  const arr=[];
  const fnditm = new Promise((resolve, reject) => {
	 Newarticle.find({},function(err,foundItems){
	   if(err)
		 console.log(err);
	   resolve(foundItems);
		for(var i=0;i<foundItems.length;i++)
	   {
		 let obj={
				id:foundItems[i].uri,
			 content:foundItems[i].title
	 
		 }
		 arr.push(obj);
	 }
	 });
  });
  

  const all = new Promise((resolve, reject) => {

	usersSchema.find({},function(err,foundItems){
	  if(err)
		console.log(err);
	  resolve(foundItems[0].bookmark);
	});
	});


	const arr1=[];
	const bookmrk = (f)=>{
	 return new Promise((resolve, reject)=>{
	   var myquery = {"uri":f };
		Newarticle.find(myquery,function(err,Items){
			  resolve(Items);
	 if(err)
	   console.log(err);
	
	 let obj={
			  id:f,
		   content:Items[0].title
   
	   }
	   arr1.push(obj);
   
	   });
	
   });
   };

	
   var recom = new Set();
   function traning(arr1,arr){

	var posts=arr1;
	var tags=arr;
	var set1 = [];
	var set2 = [];
	const tagMap = tags.reduce((acc, tag) => {
	  acc[tag.id] = tag;
	  return acc;
	}, {});
	recommender.trainBidirectional(posts, tags);
	 
	for (let post of posts) {
	  const relatedTags = recommender.getSimilarDocuments(post.id,0,10);
	  const tags = relatedTags.map(t => t.id);
	  set1.push(tags);
	}
	for(var i =0;i<set1.length;i++){
		set2=set2.concat(set1[i]);
	}
	for(var i =0;i<set2.length;i++){
		recom.add(set2[i]);
	}
}


const recomm = async () => {{		
			await fnditm;
		var foundItems= await all;
		for(var i=0;i<foundItems.length;i++)
		{    
		var f=foundItems[i];
		await bookmrk(f);
		}
		traning(arr1,arr);
				
	}
} 

app.get("/home/foryou",async function(request,response){
	console.log("running");
    await recomm();
	
	var arr2=[]
  
  for (var i = 0; i <arr1.length ; i++) {
    arr2.push(arr1[i].id)
  }
 
	let foryu=[],arru;
     recom.forEach(x=>foryu.push(x))
     var difference = foryu.filter(x => arr2.indexOf(x) === -1);
    var myquery={'uri':{$in:difference}};
     await Newarticle.find({ $query: {}, $orderby: { dateTime : -1 } },function(err,foundItems2){
		if(err)
		  console.log(err);
		arru=foundItems2;
		
	   }); 
     await Newarticle.find(myquery).sort({dateTime:'desc'}).exec(function(err,foundItems){
      if(err)
        console.log(err);
          //console.log(arru.length);
		 var e=foundItems.length;
		 for (let h =0;h<arru.length;h++)
		 	foundItems.push(arru[h]);
		console.log(foundItems.length);

		response.render("foryou",{data: {listitem:  JSON.stringify(foundItems),category: "News"}});
	
      
    });
	//createDocument();

});

app.post("/home/foryou",(request, response) => {
	if(request.body.uri)
	{
	  
	var myquery = { };
	var newvalues = { $addToSet: {
	  bookmark: {
		  $each:[ request.body.uri ]
	  }
		}
	 };
	usersSchema.updateMany(myquery,newvalues, function(err, res) {
	  if (err) throw err;
	  else
	  console.log("1 document updated");
	});
  }
});

app.get("/home",async function(request,response){
	//console.log("running");
	Newarticle.find({}).sort({dateTime:'desc'}).exec(function(err,foundItems){
		if(err)
		  console.log(err);
		//console.log(foundItems);
		response.render("list",{data: {listitem: JSON.stringify(foundItems), category: "News"}});
	  }); 
	 // createDocument();
});

app.get("/home/Small_Business",async function(request,response){
	//console.log("running");
	Newarticle.find({"category":{"$in" : 'Small_Business' }}).sort({dateTime:'desc'}).exec(function(err,foundItems){
		if(err)
		  console.log(err);
		//console.log(foundItems);
		response.render("list",{data: {listitem: JSON.stringify(foundItems), category: "Small Business"}});
	  }); 
});
app.get("/home/Financial_Services",async function(request,response){
	//console.log("running");
	Newarticle.find({"category":{"$in" : 'Financial_Services' }}).sort({dateTime:'desc'}).exec(function(err,foundItems){
		if(err)
		  console.log(err);
		//console.log(foundItems);
		response.render("list",{data: {listitem: JSON.stringify(foundItems), category: "Financial Services"}});
	  }); 
});
app.get("/home/Marketing_and_Advertising",async function(request,response){
	//console.log("running");
	Newarticle.find({"category":{"$in" : 'Marketing_and_Advertising' }}).sort({dateTime:'desc'}).exec(function(err,foundItems){
		if(err)
		  console.log(err);
		//console.log(foundItems);
		response.render("list",{data: {listitem: JSON.stringify(foundItems), category: "Marketing and Advertising"}});
	  }); 
});

app.get("/home/Agriculture_and_Forestry",async function(request,response){
	//console.log("running");
	Newarticle.find({"category":{"$in" : 'Agriculture_and_Forestry' }}).sort({dateTime:'desc'}).exec(function(err,foundItems){
		if(err)
		  console.log(err);
		//console.log(foundItems);
		response.render("list",{data: {listitem: JSON.stringify(foundItems), category: "Agriculture and Forestry"}});
	  }); 
});

app.get("/home/Investing",async function(request,response){
	console.log("running");
	Newarticle.find({"category":{"$in" : 'Investing' }}).sort({dateTime:'desc'}).exec(function(err,foundItems){
		if(err)
		  console.log(err);
		//console.log(foundItems);
		response.render("list",{data: {listitem: JSON.stringify(foundItems), category: "Investing"}});
	  }); 
});

app.get("/home/Business_Services",async function(request,response){
	//console.log("running");
	Newarticle.find({"category":{"$in" : 'Business_Services' }}).sort({dateTime:'desc'}).exec(function(err,foundItems){
		if(err)
		  console.log(err);
		//console.log(foundItems);
		response.render("list",{data: {listitem: JSON.stringify(foundItems), category: "Business Services"}});
	  }); 
});

app.get("/home/Aerospace_and_Defense",async function(request,response){
	//console.log("running");
	Newarticle.find({"category":{"$in" : 'Aerospace_and_Defense' }}).sort({dateTime:'desc'}).exec(function(err,foundItems){
		if(err)
		  console.log(err);
		//console.log(foundItems);
		response.render("list",{data: {listitem: JSON.stringify(foundItems), category: "Aerospace and Defense"}});
	  }); 
});

app.get("/home/Human_Resources",async function(request,response){
	//console.log("running");
	Newarticle.find({"category":{"$in" : 'Human_Resources' }}).sort({dateTime:'desc'}).exec(function(err,foundItems){
		if(err)
		  console.log(err);
		//console.log(foundItems);
		response.render("list",{data: {listitem: JSON.stringify(foundItems), category: "Human Resources"}});
	  }); 
});

app.listen(3000,function(){
	console.log("server Started");
});


