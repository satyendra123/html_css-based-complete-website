EX-1
data= "csrftoken=lYgDuRwrlHcswscQxb2Phf9VRonu0kuE;sessi=ytzek22yw8c41jj5qtlvqz3n20vmecgo"

new_data = data.split(';')
console.log(new_data);
const second_data = new_data.find((row)=>{
         return row.startsWith('sessi=')
})
console.log(second_data);
extract_data = second_data.split('=')[1];
console.log(extract_data)

EX-2 
