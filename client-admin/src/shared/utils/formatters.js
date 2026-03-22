export const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("es-GT", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
};

export const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("es-GT", {
        hour: "2-digit",
        minute: "2-digit",
    });
};
