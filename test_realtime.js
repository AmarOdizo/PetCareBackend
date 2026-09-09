require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealtime() {
  console.log("=== STARTING SUPABASE REALTIME TEST ===");

  // 1. Verify frontend query works
  console.log("\n[1] Verifying frontend query: supabase.from('chat_messages').select('*')");
  const { data: fetchMessages, error: fetchError } = await supabase
    .from('chat_messages')
    .select('*')
    .limit(1);

  if (fetchError) {
    console.error("❌ Error fetching from chat_messages:", fetchError.message);
    process.exit(1);
  }
  console.log("✅ Successfully queried chat_messages! Found row count:", fetchMessages.length);

  // Set up mock consultation and user IDs
  const consultationId = "mock_consultation_" + Date.now();
  const ownerId = "owner_" + Date.now();
  const doctorId = "doctor_" + Date.now();

  let ownerReceivedMessage = false;
  let doctorReceivedMessage = false;

  console.log(`\n[2] Setting up Realtime subscriptions for consultationId: ${consultationId}`);
  
  // Create Owner Channel
  const ownerChannel = supabase
    .channel(`chat_messages_${consultationId}_owner_side`)
    .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `conversationId=eq.${consultationId}`
    }, (payload) => {
        if (payload.new.senderRole === 'vet') {
            console.log("✅ Owner subscription received message from Doctor:", payload.new.message);
            ownerReceivedMessage = true;
        }
    })
    .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log("✅ Owner subscribed to Realtime channel");
    });

  // Create Doctor Channel
  const doctorChannel = supabase
    .channel(`chat_messages_${consultationId}_doctor_side`)
    .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `conversationId=eq.${consultationId}`
    }, (payload) => {
        if (payload.new.senderRole === 'owner') {
            console.log("✅ Doctor subscription received message from Owner:", payload.new.message);
            doctorReceivedMessage = true;
        }
    })
    .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log("✅ Doctor subscribed to Realtime channel");
    });

  // Wait a moment for subscriptions to be fully active
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log("\n[3] Test A: Doctor -> Owner");
  const docMsg = {
    senderId: doctorId,
    receiverId: ownerId,
    senderName: "Dr. Smith",
    senderRole: "vet",
    message: "Hello from Doctor",
    conversationId: consultationId
  };
  
  const { error: insertErr1 } = await supabase.from('chat_messages').insert([docMsg]);
  if (insertErr1) console.error("❌ Doctor Insert Error:", insertErr1.message);
  else console.log("   Doctor inserted message into Supabase");

  // Wait for Realtime payload
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log("\n[4] Test B: Owner -> Doctor");
  const ownerMsg = {
    senderId: ownerId,
    receiverId: doctorId,
    senderName: "John Doe",
    senderRole: "owner",
    message: "Hello Doctor from Owner",
    conversationId: consultationId
  };
  
  const { error: insertErr2 } = await supabase.from('chat_messages').insert([ownerMsg]);
  if (insertErr2) console.error("❌ Owner Insert Error:", insertErr2.message);
  else console.log("   Owner inserted message into Supabase");

  // Wait for Realtime payload
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log("\n=== TEST RESULTS ===");
  if (ownerReceivedMessage && doctorReceivedMessage) {
      console.log("✅ ALL REALTIME TESTS PASSED SUCCESSFULLY! Both ends received their messages in real-time.");
  } else {
      console.log("❌ TEST FAILED. Missing some realtime events.");
      console.log("Owner Received:", ownerReceivedMessage);
      console.log("Doctor Received:", doctorReceivedMessage);
  }
  
  process.exit(0);
}

testRealtime();
