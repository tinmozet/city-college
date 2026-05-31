// ၁။ လိုအပ်သော Packages များကို ခေါ်ယူခြင်း
require('dotenv').config(); // .env ဖိုင်မှ ဒေတာများကို ဖတ်ရန်
const express = require('express');
const cors = require('cors'); // ၁။ ဒီလိုင်းလေး ထည့်ပါ

const app = express();

app.use(cors()); // ၂။ ဒီလိုင်းလေးကို အပေါ်နားမှာ ထည့်ပေးပါ (အရေးကြီးဆုံး)
app.use(express.json());

// Render ပေါ်တင်လျှင် ၎င်းတို့ပေးမည့် Port ကို သုံးရန်၊ မရှိပါက 3000 ကိုသုံးရန်
const PORT = process.env.PORT || 3000;

// ၂။ Middleware များ သတ်မှတ်ခြင်း
app.use(express.json()); // Frontend မှ ပို့လိုက်သော JSON ဒေတာများကို ဖတ်နိုင်ရန်
app.use(express.urlencoded({ extended: true })); // Form ဒေတာများကို ဖတ်နိုင်ရန်
app.use(express.static(__dirname)); // HTML, CSS, JS ဖိုင်များကို Static အဖြစ် သုံးနိုင်ရန်

// ၃။ MongoDB Atlas ဒေတာဘေ့စ်နှင့် ချိတ်ဆက်ခြင်း
// Render တွင် MONGO_URI ကို Environment Variable အဖြစ် ထည့်ပေးရပါမည်
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
.then(() => console.log('MongoDB ဒေတာဘေ့စ်နှင့် အောင်မြင်စွာ ချိတ်ဆက်ပြီးပါပြီ။'))
.catch(err => {
    console.error('ဒေတာဘေ့စ် ချိတ်ဆက်မှု အမှားအယွင်း ရှိနေပါသည် -');
    console.error(err);
});

// ၄။ ဒေတာဘေ့စ် ဖွဲ့စည်းပုံ (Schema & Model) သတ်မှတ်ခြင်း
// ကျောင်းသားများ ဖောင်ဖြည့်လိုက်သည့် အချက်အလက်များ သိမ်းဆည်းရန်
const AdmissionSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'အမည် ဖြည့်သွင်းရန် လိုအပ်ပါသည်'] 
    },
    email: { 
        type: String, 
        required: [true, 'အီးမေးလ် ဖြည့်သွင်းရန် လိုအပ်ပါသည်'] 
    },
    course: { 
        type: String, 
        required: [true, 'သင်တန်း ရွေးချယ်ရန် လိုအပ်ပါသည်'] 
    },
    message: { 
        type: String 
    },
    submittedAt: { 
        type: Date, 
        default: Date.now // ဖောင်တင်သည့် အချိန်ကို အလိုအလျောက် မှတ်သားရန်
    }
});

const Admission = mongoose.model('Admission', AdmissionSchema);

// ၅။ ရေတင်လမ်းကြောင်းများ (Routes) သတ်မှတ်ခြင်း

// ပင်မစာမျက်နှာ (Homepage) ကို ပြသရန်
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Frontend မှ ဖောင်ဒေတာများကို လက်ခံပြီး Database ထဲ သိမ်းဆည်းမည့် API Endpoint
app.post('/api/admission', async (req, res) => {
    try {
        const { name, email, course, message } = req.body;

        // ဒေတာအသစ် တည်ဆောက်ခြင်း
        const newAdmission = new Admission({
            name,
            email,
            course,
            message
        });

        // Database ထဲသို့ အပြီးအပိုင် သိမ်းဆည်းခြင်း
        await newAdmission.save();

        // အောင်မြင်ကြောင်း Frontend သို့ ပြန်ကြားခြင်း
        res.status(201).json({ 
            status: "success", 
            message: "စာရင်းပေးသွင်းမှု အောင်မြင်ပြီး ဒေတာဘေ့စ်ထဲသို့ သိမ်းဆည်းလိုက်ပါပြီ။" 
        });

    } catch (error) {
        console.error('ဒေတာသိမ်းဆည်းရာတွင် အမှားဖြစ်ပွားမှု -', error);
        res.status(500).json({ 
            status: "error", 
            message: "ဆာဗာအတွင်းပိုင်း အမှားအယွင်းရှိသဖြင့် ဒေတာမသိမ်းဆည်းနိုင်ပါ။" 
        });
    }
});
// ဒေတာဘေ့စ်ထဲက ကျောင်းသားစာရင်း အားလုံးကို ပြန်ဖတ်မည့် API (GET Method)
app.get('/api/admissions', async (req, res) => {
    try {
        // Admission Model ထဲက ဒေတာအားလုံးကို အချိန်အသစ်ဆုံးကနေ အဟောင်းအတိုင်း စီပြီး ရှာခိုင်းခြင်း
        const allAdmissions = await Admission.find().sort({ submittedAt: -1 });
        
        // ရလာတဲ့ ဒေတာတွေကို Frontend သို့ ပို့ပေးခြင်း
        res.status(200).json({
            status: "success",
            data: allAdmissions
        });
    } catch (error) {
        console.error('ဒေတာဖတ်ရာတွင် အမှားဖြစ်ပွားမှု -', error);
        res.status(500).json({ 
            status: "error", 
            message: "ဒေတာများကို မဖတ်နိုင်ပါ။" 
        });
    }
});


// ၆။ Server ကို စတင်မောင်းနှင်ခြင်း
app.listen(PORT, () => {
    console.log(`ကျောင်းဝက်ဘ်ဆိုက် Server သည် Port: ${PORT} တွင် အလုပ်လုပ်နေပါပြီ။`);
});
