// besselj.js
export function besselj(x, n) {
    const M = Math;
    
    function _horner(arr, v) { 
        let z = 0;
        for(let i = 0; i < arr.length; ++i) z = v * z + arr[i]; 
        return z; 
    }
    
    function _bessel_iter(x, n, f0, f1, sign) {
        if(n === 0) return f0;
        if(n === 1) return f1;
        const tdx = 2 / x;
        let f2 = f1;
        for(let o = 1; o < n; ++o) {
            f2 = f1 * o * tdx + sign * f0;
            f0 = f1; f1 = f2;
        }
        return f2;
    }
    
    const W = 0.636619772;
    
    const b0_a1a = [57568490574.0, -13362590354.0, 651619640.7, -11214424.18, 77392.33017, -184.9052456].reverse();
    const b0_a2a = [57568490411.0, 1029532985.0, 9494680.718, 59272.64853, 267.8532712, 1.0].reverse();
    const b0_a1b = [1.0, -0.1098628627e-2, 0.2734510407e-4, -0.2073370639e-5, 0.2093887211e-6].reverse();
    const b0_a2b = [-0.1562499995e-1, 0.1430488765e-3, -0.6911147651e-5, 0.7621095161e-6, -0.934935152e-7].reverse();
    
    function bessel0(x) {
        let a=0, a1=0, a2=0, y = x * x;
        if(x < 8) {
            a1 = _horner(b0_a1a, y);
            a2 = _horner(b0_a2a, y);
            a = a1 / a2;
        } else {
            const xx = x - 0.785398164;
            y = 64 / y;
            a1 = _horner(b0_a1b, y);
            a2 = _horner(b0_a2b, y);
            a = M.sqrt(W/x)*(M.cos(xx)*a1-M.sin(xx)*a2*8/x);
        }
        return a;
    }
    
    const b1_a1a = [72362614232.0, -7895059235.0, 242396853.1, -2972611.439, 15704.48260, -30.16036606].reverse();
    const b1_a2a = [144725228442.0, 2300535178.0, 18583304.74, 99447.43394, 376.9991397, 1.0].reverse();
    const b1_a1b = [1.0, 0.183105e-2, -0.3516396496e-4, 0.2457520174e-5, -0.240337019e-6].reverse();
    const b1_a2b = [0.04687499995, -0.2002690873e-3, 0.8449199096e-5, -0.88228987e-6, 0.105787412e-6].reverse();
    
    function bessel1(x) {
        let a=0, a1=0, a2=0, y = x*x;
        const xx = M.abs(x) - 2.356194491;
        if(Math.abs(x) < 8) {
            a1 = x*_horner(b1_a1a, y);
            a2 = _horner(b1_a2a, y);
            a = a1 / a2;
        } else {
            y = 64 / y;
            a1=_horner(b1_a1b, y);
            a2=_horner(b1_a2b, y);
            a=M.sqrt(W/M.abs(x))*(M.cos(xx)*a1-M.sin(xx)*a2*8/M.abs(x));
            if(x < 0) a = -a;
        }
        return a;
    }
    
    // Función interna para hacer la recursión
    function besselj_internal(x, n) {
        n = Math.round(n);
        if(!isFinite(x)) return isNaN(x) ? x : 0;
        if(n < 0) return ((n%2)?-1:1)*besselj_internal(x, -n);
        if(x < 0) return ((n%2)?-1:1)*besselj_internal(-x, n);
        if(n === 0) return bessel0(x);
        if(n === 1) return bessel1(x);
        if(x === 0) return 0;
        
        let ret=0.0;
        if(x > n) {
            ret = _bessel_iter(x, n, bessel0(x), bessel1(x), -1);
        } else {
            const m=2*M.floor((n+M.floor(M.sqrt(40*n)))/2);
            let jsum=false;
            let bjp=0.0, sum=0.0;
            let bj=1.0, bjm = 0.0;
            const tox = 2 / x;
            for (let j=m;j>0;j--) {
                bjm=j*tox*bj-bjp;
                bjp=bj;
                bj=bjm;
                if (M.abs(bj) > 1E10) {
                    bj *= 1E-10;
                    bjp *= 1E-10;
                    ret *= 1E-10;
                    sum *= 1E-10;
                }
                if (jsum) sum += bj;
                jsum=!jsum;
                if (j == n) ret=bjp;
            }
            sum=2.0*sum-bj;
            ret /= sum;
        }
        return ret;
    }
    
    return besselj_internal(x, n);
}
