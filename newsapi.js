

const express = require("express");
const bodyParser = require("body-parser");
const request= require("request");
var mongoose = require("mongoose");
var k;
const app =express();
var erBase = require("eventregistry");
//var  = require("ReturnInfo");
var er = new erBase.EventRegistry();

const ContentBasedRecommender = require('content-based-recommender');



var urlencodedParser=bodyParser.urlencoded({extended:false});

let SummarizerManager = require("node-summarizer").SummarizerManager;
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/mydb",{ useNewUrlParser: true, useUnifiedTopology: true})
.then (()=>console.log("Connection Successful"))
.catch((err) => console.log(err));
const newarticlesSchema = new mongoose.Schema({
    uri: String,
    lang: String,
    isDuplicate: String,
    date: String,
    time: String,
    //dateTime: String,
    //dateTimePub: String,
    //dataType: String,
    //sim: String,
    url: String,
    title: String,
    //body: String,

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
	wgt: String,
	relevance: String,
	summary: String,
	category: []
});

const usersSchema = mongoose.model('User', {
    name: String,
    email: String,
    bookmark:[{type: Object, unique: true } ]
});


const Newarticle = new mongoose.model("Newarticle", newarticlesSchema);

const createDocument = async () => {
   

	var er = new erBase.EventRegistry({apiKey: "4a5f71cf-2c58-4677-9365-ff6777acfd2e"});
	
	// er.getConceptUri("Apple").then((conceptUri) => {
	// 	const q3 = new erBase.QueryArticles({ conceptUri });
	// 	const returnInfo = new erBase.ReturnInfo({articleInfo: new erBase.ArticleInfoFlags({socialScore: true})});
	// 	const requestArticlesInfo = new erBase.RequestArticlesInfo({
	// 		count: 5,
	// 		sortBy: "socialScore",
	// 		returnInfo: returnInfo,
	// 	});
	// 	q3.setRequestedResult(requestArticlesInfo);
	// 	console.log(q3.setRequestedResult(requestArticlesInfo));
	// 	return er.execQuery(q3);
	// }).then(async(response) => {
	// 	console.info(JSON.stringify(response));
	// });

	er.getCategoryUri("Business").then((categoryUri) => {
		const iterOpts = {
			maxItems: 100,
			categoryUri: categoryUri,
			returnInfo: new erBase.ReturnInfo({articleInfo: new erBase.ArticleInfoFlags({categories: true})}),
			isDuplicateFilter: "skipDuplicates",
		};
		const q5 = new erBase.QueryArticlesIter(er, iterOpts);
		q5.execQuery(async (item) => {
			//console.info(item);
			
			var art = item;
			//console.log(art);
			
				//console.log(art);
				//console.log(art.categories);
				var body=JSON.stringify(art.body);
			 let Summary = await summ(body);
			 //console.log(Summary);
			 //console.log(art.categories);
			 var category =await catego(art.categories);
			//console.log(category);
				//var a=JSON.stringify(k[art]);
				var a=art;
				var b={
				 uri:a.uri,
				 lang:a.lang,
				 isDuplicate: JSON.stringify(a.isDuplicate),
				 date: a.date,
				 time: a.time,
				 //dateTime: a.dateTime,
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
				 wgt: JSON.stringify(a.wgt),
				 relevance: JSON.stringify(a.relevance),
				 summary:Summary,
				 category: category
				}
				console.log(b);
				const arti = new Newarticle(b);
				//arti.save();
				//console.log(result);
				
			 
		});
	});

		
}

//createDocument();


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



// 
// var newstr = ""; 

// for( var i = 0; i < str.length; i++ )  

//     if( !(str[i] == '\n' || str[i] == '\r' ) ) 

//         newstr += str[i];
// 		newstr = newstr.replace(/"([^"]+(?="))"/g, '$1');
// 		//console.log(newstr);
// 			let Summarizer = new SummarizerManager(newstr,3);
// 			//let Summary = Summarizer.getSummaryByFrequency().summary;

// 			let summary = Summarizer.getSummaryByRank().then((summary_object)=>{
// 				return summary_object.summary
// 			});
// 			summary.then(function(result){
// 				console.log(result);
// 				})
			//console.log(summary);

			// Newarticle.find({_id: "607c0b125422e927f07b3d01"},function(err,foundItems){
			// 	//console.log(foundItems[0].body);
			// 	var str="";
			// 	str=str+foundItems[0].body;
			// 	console.log(str);
			// 	var newstr = ""; 

			// 	newstr=newstr.replace( /[\r\n]+/gm, "" );
			// 			newstr = newstr.replace(/"([^"]+(?="))"/g, '$1');
			// 			console.log(newstr);
			// let Summarizer = new SummarizerManager(newstr,3); 
			// 		let summary = Summarizer.getSummaryByRank().then((summary_object)=>{
			// 			return summary_object.summary
			// 		});
			// 		summary.then(function(result){
			// 			//console.log("Summary:"+result);
						
			// 				var myquery = { _id: "607c0b125422e927f07b3d01" };
			// 				var newvalues = { $set: {summary: `${result}`} };
			// 				// Newarticle.updateMany(myquery, newvalues, function(err, res) {
			// 				// 	if (err) throw err;
			// 				// 	console.log("1 document updated");
			// 				// 	//db.close();
			// 				//   });
							
			// 				//response.render("list",{listitem: foundItems});
			//  			});
			// 		});


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
			
			// Newarticle.find({},async function(err,foundItems){
			// 	console.log(foundItems.length);
			// 	for(var i=0;i<foundItems.length;i++)
			// 	{
			// 		//console.log(foundItems[i].body);
			// 		var str="";
			// 		str=str+foundItems[i].body;
			// 		str=str.replace( /[\r\n]+/gm, "" );
			// 		//console.log("After"+str);
			// 		str = str.replace(/"([^"]+(?="))"/g, '$1');
			// 		let summa = await summ(str);
			// 		//console.log(summa);
			// 		var f=foundItems[i].id;
			// 		let v = await up(f,summa);
			// 			//console.log(v);
						
			// 			console.log(foundItems[i].id);
			// 	}
			// 	});
		

	app.get("/home",function(request,response){
		console.log("running");

		Newarticle.find({},function(err,foundItems){
			if(err)
				console.log(err);
			//console.log(foundItems);
			response.render("list",{listitem: foundItems});
		});

});


app.post("/home",async (request, response) => {
    const data = await request.body;
  console.log(request.body);
  //console.log(request.body.category);

  Newarticle.find({"category":{"$in" : request.body.category }}, function(err,foundItems){
    if(err)
      console.log(err);
    //console.log(foundItems);
    response.render("list",{listitem: foundItems});
  }); 
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
	//db.close();
  });
}
});

app.get("/home/bookmark",function(request,response){
	console.log("running");

	usersSchema.find({},function(err,Items){
		if(err)
			console.log(err);
		//console.log(Items[0].bookmark);
		Newarticle.find({"uri": Items[0].bookmark },function(err,foundItems){
			if(err)
			  console.log(err);
			//console.log(foundItems);
			response.render("foryou",{listitem: foundItems});
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
	   //console.log( foundItems);
	
	});
	
	});


	const arr1=[];
	const bookmrk = (f)=>{
	 return new Promise((resolve, reject)=>{
	   var myquery = {"uri":f };
			   //console.log(myquery);
   
		Newarticle.find(myquery,function(err,Items){
			  resolve(Items);
   
			 //console.log(Items);
		   // console.log( Items[0].summary);
			//console.log("Hii");
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
	//console.log(posts);
	//console.log(tags);
	var set1 = [];
	var set2 = [];
	//console.log(posts.length);

	const tagMap = tags.reduce((acc, tag) => {
	  acc[tag.id] = tag;
	  return acc;
	}, {});

	 
	//const recommender = new ContentBasedRecommender();
	 
	recommender.trainBidirectional(posts, tags);
	 
	for (let post of posts) {
	  const relatedTags = recommender.getSimilarDocuments(post.id,0,10);
	  const tags = relatedTags.map(t => t.id);
	  //console.log(post.content, 'related tags:', tags1);
	  //console.log(relatedTags);
	  //console.log(tags);
	  set1.push(tags);
	}
	for(var i =0;i<set1.length;i++){
		set2=set2.concat(set1[i]);
	}
	//console.log(set2.length);
	for(var i =0;i<set2.length;i++){
		recom.add(set2[i]);
	}
	//console.log(recom.size);
	//console.log(recom);
}


const recomm = async () => {{
	
		
			await fnditm;

		var foundItems= await all;

		//console.log(foundItems);
		
		for(var i=0;i<foundItems.length;i++)
		{    
		var f=foundItems[i];
		//console.log(k1);
		await bookmrk(f);
		}
		//console.log(arr.length);
		//console.log(arr1);
		traning(arr1,arr);
				
	}
} 



app.get("/home/foryou",async function(request,response){
	console.log("running");
    await recomm();
	//console.log(recom);
	// await Newarticle.find({uri:recom},function(err,foundItems){
	// 	if(err)
	// 	  console.log(err);
	// 	  //console.log(foundItems);
	// 	  //response.render("foryou",{listitem: foundItems});
	// });
	var arr2=[]
  //console.log(arr1);
  for (var i = 0; i <arr1.length ; i++) {
    arr2.push(arr1[i].id)
  }
  //console.log(arr2);
	let foryu=[];
     //var x;
     recom.forEach(x=>foryu.push(x))
     var difference = foryu.filter(x => arr2.indexOf(x) === -1);
     //console.log(difference);
     
    var myquery={'uri':{$in:difference}};
    //var myquery={'uri':{$in:foryu}};

    Newarticle.find(myquery,function(err,foundItems){
      if(err)
        console.log(err);
      //console.log(foundItems);
      response.render("foryou",{listitem: foundItems});
    });

});

app.get("/home/Small_Business",async function(request,response){
	console.log("running");
	Newarticle.find({"category":{"$in" : 'Small_Business' }}, function(err,foundItems){
		if(err)
		  console.log(err);
		//console.log(foundItems);
		response.render("foryou",{listitem: foundItems});
	  }); 
});
app.get("/home/Financial_Services",async function(request,response){
	console.log("running");
	Newarticle.find({"category":{"$in" : 'Financial_Services' }}, function(err,foundItems){
		if(err)
		  console.log(err);
		//console.log(foundItems);
		response.render("foryou",{listitem: foundItems});
	  }); 
});
app.get("/home/Marketing_and_Advertising",async function(request,response){
	console.log("running");
	Newarticle.find({"category":{"$in" : 'Marketing_and_Advertising' }}, function(err,foundItems){
		if(err)
		  console.log(err);
		//console.log(foundItems);
		response.render("foryou",{listitem: foundItems});
	  }); 
});

app.get("/home/Agriculture_and_Forestry",async function(request,response){
	console.log("running");
	Newarticle.find({"category":{"$in" : 'Agriculture_and_Forestry' }}, function(err,foundItems){
		if(err)
		  console.log(err);
		//console.log(foundItems);
		response.render("foryou",{listitem: foundItems});
	  }); 
});

app.get("/home/Investing",async function(request,response){
	console.log("running");
	Newarticle.find({"category":{"$in" : 'Investing' }}, function(err,foundItems){
		if(err)
		  console.log(err);
		//console.log(foundItems);
		response.render("foryou",{listitem: foundItems});
	  }); 
});

app.get("/home/Business_Services",async function(request,response){
	console.log("running");
	Newarticle.find({"category":{"$in" : 'Business_Services' }}, function(err,foundItems){
		if(err)
		  console.log(err);
		//console.log(foundItems);
		response.render("foryou",{listitem: foundItems});
	  }); 
});

app.get("/home/Aerospace_and_Defense",async function(request,response){
	console.log("running");
	Newarticle.find({"category":{"$in" : 'Aerospace_and_Defense' }}, function(err,foundItems){
		if(err)
		  console.log(err);
		//console.log(foundItems);
		response.render("foryou",{listitem: foundItems});
	  }); 
});

app.get("/home/Human_Resources",async function(request,response){
	console.log("running");
	Newarticle.find({"category":{"$in" : 'Human_Resources' }}, function(err,foundItems){
		if(err)
		  console.log(err);
		//console.log(foundItems);
		response.render("foryou",{listitem: foundItems});
	  }); 
});

app.listen(3000,function(){
	console.log("server Started");
});


