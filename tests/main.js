
// const data = [{ prop1: "exemple1", prop2: "exemple2" }, { prop1: "exemple2", prop2: "exemple2" }, { prop1: "exemple3", prop2: "exemple2" }];
// const matrix = data.map(obj => Object.values(obj));
// matrix.unshift(Object.keys(data[0]))
// console.log(matrix);

const { ObjectId } = require("mongodb");


// console.log(Object.keys({name: '', re: ''}).indexOf("re"));

array = []
object = {}
string = ""

// console.log(JSON.stringify(["salut"])[0] === '{');
// console.log(JSON.stringify({salut: 'toi'})[0] === '{');
console.log(typeof new ObjectId('655bdfa8e8fa052e13813af1'));