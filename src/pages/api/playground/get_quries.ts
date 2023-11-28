import readExcel from 'read-excel-file/node';

export default async function handler(
    req: any,
    res: any
) {
    const quires:string[] = await loadQueries();
    res.status(200).json(quires);
}

const loadQueries = async () => {
    const data = await readExcel('./Checklist.xlsx');
    const quires: any= [];
    for (let i in data) {

        let no= "";
        let text="";            
        no = data[i]["0"].toString();
        text = data[i]["1"].toString();
        
        if(no == "#"){
            continue;
        }

        const splited_no = no.split(".");
        let is_header = false;
        if(splited_no.length == 1) {
            is_header = true;
        } else {
            if(splited_no[1].length == 1) {
                is_header = true;
            }
        }
        
        quires.push({
            no,
            text,
            is_header,
            answer:''
        })
    }
    return quires;
}
