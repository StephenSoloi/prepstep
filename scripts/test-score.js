
const testScore = (id) => {
    return (id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 15 + 70);
};

console.log("ID 1:", testScore("cmm7rfa640000ve4w4psn04n4"));
console.log("ID 1 (again):", testScore("cmm7rfa640000ve4w4psn04n4"));
console.log("ID 2:", testScore("another-id"));
