import Chapter from "../models/chapterModel.js";

// next 

const GLOBAL_COURSE_ID = "69c78e53ac0488fe6c376be9"; 
const GLOBAL_ADMIN_ID = "69c6833d6a7053d56d8a4ea5";  

const chaptersData = [
  { title: "Foundations of Neural Networks & Perceptrons", slug: "nn-foundations", order: 1, duration: 45 },
  { title: "Activation Functions: Sigmoid, ReLU & Softmax", slug: "activation-functions", order: 2, duration: 40 },
  { title: "Backpropagation & Gradient Descent Math", slug: "backpropagation-math", order: 3, duration: 90 },
  { title: "Optimizers: Adam, RMSprop & Momentum", slug: "deep-learning-optimizers", order: 4, duration: 60 },
  { title: "Convolutional Neural Networks (CNN) for Vision", slug: "cnn-computer-vision", order: 5, duration: 85 },
  { title: "Recurrent Neural Networks (RNN) & LSTMs", slug: "rnn-lstm-sequence", order: 6, duration: 75 },
  { title: "Regularization: Dropout, Batch Norm & L2", slug: "dl-regularization", order: 7, duration: 55 },
  { title: "Transfer Learning & Fine-tuning Models", slug: "transfer-learning", order: 8, duration: 65 },
  { title: "Generative Adversarial Networks (GANs)", slug: "gans-generative-ai", order: 9, duration: 110 },
  { title: "Attention Mechanism & Transformer Architecture", slug: "attention-transformers", order: 10, duration: 120 }
];

export const seedChapters = async () => {
  try {

    const formattedChapters = chaptersData.map((ch) => ({
      courseId: GLOBAL_COURSE_ID,
      title: ch.title,
      slug: ch.slug,
      description: `Deep dive into ${ch.title} for production environments.`,
      order: ch.order,
      isPreview: ch.order === 1, 
      status: "published",
      estimatedDurationMinutes: ch.duration,
      createdBy: GLOBAL_ADMIN_ID,
    }));



    await Chapter.insertMany(formattedChapters);
    console.log(`🚀 Success: 10 Chapters inserted for Course: ${GLOBAL_COURSE_ID}`);

    process.exit();
  } catch (error) {
    console.error("Error seeding data:", error.message);
    process.exit(1);
  }
};
