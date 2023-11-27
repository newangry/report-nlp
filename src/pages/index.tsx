import { getBrands } from "@/utils/app/global";
import { Box, Button, Flex, Grid, List, Loader, Table, Text, TextInput, Textarea, ThemeIcon, rem, Image } from "@mantine/core";
import { useUser } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Dropzone } from '@mantine/dropzone';
import { IconCircleCheck, IconPdf, IconUpload } from '@tabler/icons-react';
import { getFilecontent } from "@/utils/app/train";
import { useChat } from "ai/react";
import ChatMessage from "@/components/Playground/ChatMessage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Index = () => {
    const [isTrain, setIsTrain] = useState<boolean>(false);
    const [query, setQuery] = useState<string>('');
    const [isLoad, setIsLoad] = useState<boolean>(false)
    const [files, setFiles] = useState<String[]>([])
    const [loadingData, setLoadingData] = useState<boolean>(false);
    const [answers, setAnswers] = useState<{
        query: string,
        answer: string
    }[]>([]);
    const { messages, append, setMessages, reload, isLoading } = useChat({
        api: '/api/playground/chat', initialInput: 'test',
        body: {
            query
        }
    });

    useEffect(() => {
        initLanguage();
        getFiles()
    }, [])

    const initLanguage = () => {
        var addScript = document.createElement("script");
        addScript.setAttribute(
            "src",
            "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        );
        document.body.appendChild(addScript);
        (window as any).googleTranslateElementInit = googleTranslateElementInit;
    }

    const googleTranslateElementInit = () => {
        new (window as any).google.translate.TranslateElement(
            {
                pageLanguage: "en",
                autoDisplay: false
            },
            "google_translate_element"
        );
    };

    const handleSend = async () => {
        if (query == "") {
            alert("Input query")
        } else {
            setMessages([]);
            append({
                content: 'test',
                role: "user",
                createdAt: new Date()
            })
        }
    }

    const trainFile = async (file: File) => {
        setIsTrain(true);
        const file_content = await getFilecontent(file);
        try {
            const res = await fetch("/api/train/train_file", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(file_content),
            });
            getFiles()

        } catch (e) {
            console.log(e);
        }
        setIsTrain(false);
    }

    const getFiles = async () => {
        setIsLoad(true);
        const res = await fetch('/api/train/get_files', {
            method: 'post'
        })
        if (res.status == 200) {
            const data = await res.json();
            setFiles(data)
        }
        setIsLoad(false);
    }

    const generateAnswer = async () => {
        setLoadingData(true)
        let res = await fetch('/api/playground/get_quries');
        const data:any = []
        if(res.status == 200) {
            const quires = await res.json();
            for(let k=0; k<quires.length; k+=10){
                let promises:any = [];
                for(let j=k; j<k+10; j++) {
                    if(j>=quires.length-1) {
                        break;
                    }
                    promises.push(getAnswer(quires[j]));
                }
                const result = await Promise.all(promises);
                result.map((item) => {
                    if(item && item.answer != "") {
                        data.push(item);
                    }
                })
            } 
        }
        setAnswers(data);
        setLoadingData(false)
    }

    const getAnswer = async(query: string) => {
        try {
            const res = await fetch('/api/playground/chat', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query
                }),
            })
    
            if (res.status == 200) {
                const data = await res.json();
                return data;
            } else {
                return false;
            }
        }catch(e){
            return false;
        }
    }

    return (
        <Box >
            <Flex justify={'space-between'} align={'center'} p={15} sx={(theme) => ({
                borderBottom: `1px solid #dbd7d7`
            })}>
                <Flex align={'center'}>
                    <Image src='/logo.jpg' alt="" width={200}/>
                    <Text size={25}>
                        ESIA Reports Automatic Assessment Solution
                    </Text>
                </Flex>
                <LanguageSwitcher />
            </Flex>
            <Grid gutter={50} p={20}>
                <Grid.Col md={3} lg={3} sm={12}>
                    <Flex justify={'center'} gap={40} w={'100%'} direction={'column'}>
                        <Flex direction={'column'} gap={20}>
                            <Dropzone
                                accept={{
                                    'image/*': [], // All images
                                    'text/html': ['.html', '.htm', '.pdf', '.doc', '.docx', '.xls', '.csv', '.xlsx'],
                                }}
                                bg={'#F4F6F8'}
                                pt={30}
                                pb={30}
                                w={'100%'}
                                onDrop={(files) => {
                                    trainFile(files[0])
                                }}
                                loading={isTrain}
                            >
                                <Flex
                                    justify={'center'}
                                    gap={5}
                                    direction={'column'}
                                    align={'center'}
                                >
                                    <IconUpload color="#919EAB" />
                                    <Text color="#919EAB" size={14}>
                                        Drag files here to upload
                                    </Text>
                                    <Text color="#18232A" size={13}
                                        weight={500}
                                        sx={(theme) => ({
                                            textDecoration: 'underline'
                                        })}
                                    >
                                        or browse for files
                                    </Text>
                                </Flex>
                            </Dropzone>
                            <Button color="green"
                                disabled={loadingData}
                                onClick={() => {
                                    generateAnswer()
                                }}>
                                Generate Answer!
                            </Button>
                        </Flex>
                        <Flex justify={'center'} gap={20} direction={'column'} >
                            <Text size={20} color="blue">
                                Uploded File List
                            </Text>
                            {
                                isLoad ? <Flex align={'center'} justify={'center'} ><Loader /></Flex> :
                                    files.length == 0 ?
                                        <Text align="center">No Uploaded files</Text> :
                                        <List
                                            spacing="xs"
                                            size="sm"
                                            center
                                            icon={
                                                <ThemeIcon color="teal" size={24} radius="xl">
                                                    <IconPdf style={{ width: rem(16), height: rem(16) }} />
                                                </ThemeIcon>
                                            }
                                        >
                                            {
                                                files.map((item: any, index) =>
                                                    <List.Item key={index}>{item.name}</List.Item>
                                                )
                                            }
                                        </List>

                            }
                        </Flex>
                    </Flex>
                </Grid.Col>
                <Grid.Col md={9} lg={9} sm={12}>
                    {
                        
                            answers.length == 0 ?
                                <Box>
                                    <Text align="center" size={"xl"}>
                                        No generated Answer
                                    </Text>
                                    <Text align="center" size={'sm'} color="green">
                                        {`Please click "Generate Answer!" button`}
                                    </Text>
                                </Box> :
                                <Table>
                                    <thead>
                                        <tr>
                                            <th>Question</th>
                                            <th>Answer</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            answers.map((item, key) =>
                                                <tr key={key}>
                                                    <td width={'50%'}>{item.query}</td>
                                                    <td width={'50%'}>
                                                        <ChatMessage
                                                            message={item.answer}
                                                        />
                                                    </td>
                                                </tr>
                                            )
                                        }
                                    </tbody>
                                </Table>
                    }
                    <Box mt={'20px'}>
                        {
                            loadingData ? <Flex align={'center'} justify={'center'}><Loader /></Flex>:<></>
                        }
                    </Box>
                </Grid.Col>
            </Grid>
        </Box>
    )
}

export default Index;