EX-1
data= "csrftoken=lYgDuRwrlHcswscQxb2Phf9VRonu0kuE;session=ytzek22yw8c41jj5qtlvqz3n20vmecgo"

new_data = data.split(';')                                            [  csrftoken=lYgDuRwrlHcswscQxb2Phf9VRonu0kuE
console.log(new_data);                                                   session=ytzek22yw8c41jj5qtlvqz3n20vmecgo
const second_data = new_data.find((row)=>{                            ]
         return row.startsWith('session=')
})
console.log(second_data);                                             [ session=ytzek22yw8c41jj5qtlvqz3n20vmecgo]
extract_data = second_data.split('=')[1];                             [session
console.log(extract_data)                                              ytzek22yw8c41jj5qtlvqz3n20vmecgo
                                                                      ]
EX-2                                                        EX-3 
const currenttime = new Date();                                  const currenttime = new Date();
const newtime = currenttime.toLocaleString();                    const isoString = currenttime.toISOString();
const datetime = newtime.split(',')[1]                           const new_date = isoString.split('T')[0];
console.log(datetime)                                            console.log(new_date);
