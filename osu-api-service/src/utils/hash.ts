import bcrypt from "bcryptjs";
import { createHash } from "crypto";

export const hashPassword = async (pw: string): Promise<string> => {
    const saltRounds = await bcrypt.genSalt();

    const md5 = createHash('md5').update(pw).digest('hex');

    const hash = await bcrypt.hash(md5, saltRounds);

    return hash;
}

export const verifyPassword = (pw: string, hash: string) => {
    const md5 = createHash('md5').update(pw).digest('hex');

    return bcrypt.compare(md5, hash);
}